import TPS from "../TPS";

import { last, times } from "lodash";

export default class GameNavigation {
  _setPly(plyID, isDone = false) {
    this.state.plyID = plyID;
    this.state.plyIsDone = isDone;
  }

  setTarget(ply) {
    if (this.state.selected.pieces.length) {
      return false;
    }
    this.state.targetBranch = ply.branch;
    if (
      this.state.ply &&
      (ply.branches.includes(this.state.ply) ||
        !this.state.ply.isInBranch(ply.branch))
    ) {
      return this.goToPly(ply.id, this.state.plyIsDone);
    } else {
      return true;
    }
  }

  _afterPly(ply) {
    if (ply.result) {
      if (ply.result.type === "R" && !ply.result.roads) {
        ply.result.roads = this.findRoads();
      }
      this.state.roads = ply.result.roads;
    } else if (ply.index === this.state.plies.length - 1) {
      this.checkGameEnd();
    }
    if (
      this.state.isGameEnd ||
      (this.state.nextPly && this.state.nextPly.branches.length)
    ) {
      this.saveBoardState();
    }
  }

  _doPly() {
    const ply = this.state.plyIsDone ? this.state.nextPly : this.state.ply;
    if (ply && this._doMoveset(ply.toMoveset(), ply.color, ply)) {
      this._setPly(ply.id, true);
      this._afterPly(ply);
      this.state.roads = ply.result ? ply.result.roads : null;
      return true;
    } else {
      return false;
    }
  }

  _undoPly() {
    const ply = this.state.plyIsDone ? this.state.ply : this.state.prevPly;
    if (ply && this._doMoveset(ply.toUndoMoveset(), ply.color, ply)) {
      this._setPly(ply.id, false);
      this.state.roads = null;
      if (ply.branches.length) {
        this.saveBoardState();
      }
      return true;
    } else {
      return false;
    }
  }

  _doMoveset(moveset, color = 1, ply = null) {
    let stack = [];

    if (moveset[0].errors) {
      throw new Error(...moveset[0].errors);
      return false;
    }

    for (let i = 0; i < moveset.length; i++) {
      const move = moveset[i];
      const action = move.action;
      const x = move.x;
      const y = move.y;
      const count = move.count || 1;
      let flatten = move.flatten;
      const type = move.type;
      const square = this.state.squares[y][x];

      if (type) {
        if (action === "pop") {
          // Undo placement
          this.state.unplayPiece(square);
        } else {
          // Do placement
          const piece = this.state.playPiece(color, type, square);
          if (!piece) {
            return false;
          }
          piece.ply = ply;
        }
      } else if (action === "pop") {
        // Undo movement
        times(count, () => stack.push(square.popPiece()));
        if (flatten && square.pieces.length) {
          square.piece.isStanding = true;
          square._setPiece(square.piece);
        }
      } else {
        // Do movement
        if (square.pieces.length && square.piece.isStanding) {
          if (stack[0].isCapstone) {
            if (ply && !flatten) {
              flatten = ply.wallSmash = "*";
              this._updatePTN();
            }
          } else {
            throw new Error("Invalid ply");
            return false;
          }
        }
        if (flatten && square.pieces.length) {
          square.piece.isStanding = false;
          square._setPiece(square.piece);
        } else if (flatten) {
          ply.wallSmash = "";
          this._updatePTN();
        }

        times(count, () => {
          let piece = stack.pop();
          if (!piece) {
            throw new Error("Invalid ply");
            return false;
          }
          square.pushPiece(piece);
        });
      }
    }

    return true;
  }

  _undoMoveset(moveset, color = 1, ply = null) {
    return this._doMoveset(
      moveset
        .map((move) => ({
          ...move,
          action: move.action === "pop" ? "push" : "pop",
        }))
        .reverse(),
      color,
      ply
    );
  }

  doTPS(tps = this.tags.tps.value) {
    if (tps.constructor === String) {
      tps = TPS.parse(tps);
    }
    const grid = tps.grid;
    let stack, square, piece, type;
    this.state.clearBoard();
    grid.forEach((row, y) => {
      row.forEach((col, x) => {
        if (col[0] !== "x") {
          stack = col.split("");
          square = this.state.squares[y][x];
          while ((piece = stack.shift())) {
            if (/[SC]/.test(stack[0])) {
              type = stack.shift();
            } else {
              type = "flat";
            }
            this.state.playPiece(piece, type, square);
          }
        }
      });
    });
  }

  goToPly(plyID, isDone) {
    const targetPly = this.plies[plyID];

    if (!targetPly || !this.state.ply || this.state.selected.pieces.length) {
      return false;
    }

    const target = {
      plyIsDone: isDone,
      move: targetPly.move,
      branch: targetPly.branch,
      number: targetPly.move.number,
    };

    // Load a board state?
    if (!this.state.ply.isInBranch(target.branch)) {
      let parentPly = this.branches[target.branch];
      while (parentPly && !(parentPly.id in this.boards)) {
        // Find the closest branch that has a saved board state
        parentPly = this.branches[parentPly.branches[0].branch];
      }
      if (
        parentPly &&
        parentPly.id in this.boards &&
        "false" in this.boards[parentPly.id]
      ) {
        // Load the board state
        this.state.setBoard(
          this.boards[parentPly.id].false,
          parentPly.id,
          false
        );
      } else {
        // Failed to find a close board state, so go to the beginning
        // (This should theoretically never happen)
        this.state.setBoard(this.boards[0].false, 0, false);
      }
    } else if (
      plyID in this.boards &&
      Math.abs(targetPly.index - this.state.ply.index) > this.size * this.size
    ) {
      // Load board state if it exists and is far enough away
      if (!(isDone in this.boards[plyID])) {
        isDone = !isDone;
      }
      this.state.setBoard(this.boards[plyID][isDone], plyID, isDone);
    }

    // Set targetBranch if target is outside of it
    if (!targetPly.isInBranch(this.state.targetBranch)) {
      this.state.targetBranch = target.branch;
    }

    if (this.state.ply.branches.includes(targetPly)) {
      // Switch to the target branch if we're on a sibling
      if (this.state.plyIsDone) {
        this._undoPly();
      }
      this._setPly(targetPly.id, false);
    }

    if (this.state.ply.index < targetPly.index) {
      while (this.state.ply.index < targetPly.index && this._doPly()) {
        // Go forward until we reach the target ply
      }
    } else if (this.state.ply.index > targetPly.index) {
      while (this.state.ply.index > targetPly.index && this._undoPly()) {
        // Go backward until we reach the target ply
      }
    }

    // Do or undo the target ply
    if (target.plyIsDone !== this.state.plyIsDone) {
      if (target.plyIsDone) {
        this._doPly();
      } else {
        this._undoPly();
      }
    }

    return true;
  }

  first() {
    return this.goToPly(this.state.plies[0].id, false);
  }

  last() {
    return this.goToPly(last(this.state.plies).id, true);
  }

  prev(half = false) {
    if (this.state.selected.pieces.length) {
      return false;
    }
    if (this.state.plyIsDone) {
      return this._undoPly();
    } else if (this.state.prevPly) {
      return this.goToPly(this.state.prevPly.id, half);
    }
    return false;
  }

  next(half = false) {
    if (this.state.selected.pieces.length) {
      return false;
    }
    if (!this.state.plyIsDone) {
      return this._doPly();
    } else if (this.state.nextPly) {
      return this.goToPly(this.state.nextPly.id, !half);
    }
    return false;
  }
}
