export default class Move {
  constructor(parts = {}) {
    this.game = parts.game;
    this.id = parts.id;
    this.linenum = parts.linenum;
    if (this.linenum) {
      this.linenum.move = this;
    }
    this.index =
      parts.index !== undefined
        ? parts.index
        : this.linenum.number - this.game.firstMoveNumber;
    this.plies = [];
    if (parts.ply1) {
      this.ply1 = parts.ply1;
    }
    if (parts.ply2) {
      this.ply2 = parts.ply2;
    }
  }

  get number() {
    return this.linenum.number;
  }
  get branch() {
    return this.linenum.branch;
  }

  get ply1() {
    return this.plies[0] || null;
  }
  set ply1(ply) {
    return this.setPly(ply, 0);
  }

  get ply2() {
    return this.plies[1] || null;
  }
  set ply2(ply) {
    return this.setPly(ply, 1);
  }

  setPly(ply, index = 0) {
    this.plies[index] = ply;
    if (!ply) {
      if (index === 1 || this.plies.length === 1) {
        this.plies.length--;
      }
      if (this.plies.length === 1 && this.plies[0].isNop) {
        this.plies.length--;
      }
      return;
    }
    ply.game = this.game;
    ply.move = this;
    ply.branch = this.linenum.branch;
    ply.index = this.index * 2 + index - this.game.firstPlayer + 1;
    if (
      !ply.isNop &&
      this.linenum.branch &&
      this.linenum.isRoot &&
      (index === 0 || this.ply1.isNop)
    ) {
      // Looks like we're adding a new branch
      const original = this.game.moves.find(
        move =>
          move.branch === this.linenum.parentBranch &&
          move.number === this.linenum.parentNumber
      );
      if (original && original.plies[index]) {
        // Add this ply to the original ply's branch list,
        // making sure the first one is the original itself
        original.plies[index].branches[0] = original.plies[index];
        original.plies[index].branches.push(ply);
        this.plies[index].branches = original.plies[index].branches;

        if (this.ply1.isNop) {
          // If first ply is placeholder, save reference to its original
          this.ply1Original = original.ply1;
        }
      }
    }
    this.plies = this.plies.concat();
  }

  text(comments) {
    let ply1 = "";
    let ply2 = "";
    let comments1 = "";
    let comments2 = "";

    if (this.ply1) {
      ply1 = this.ply1.text() + " ";
    }
    if (this.ply2) {
      ply2 = this.ply2.text() + " ";
    }

    if (comments) {
      if (comments[0] && comments[0].length) {
        comments1 = comments[0].map(comment => comment.text()).join(" ") + " ";
      }
      if (comments[1] && comments[1].length) {
        comments2 = comments[1].map(comment => comment.text()).join(" ");
      }
    }

    return this.linenum.text() + " " + ply1 + comments1 + ply2 + comments2;
  }
}
