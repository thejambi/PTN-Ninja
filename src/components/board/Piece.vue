<template>
  <div
    class="piece"
    :style="{
      transform: `translate3d(${x}%, -${y}%, ${z}em)`,
    }"
  >
    <div
      @click.left="select()"
      @click.right.prevent="select(true)"
      class="stone"
      :class="{
        ['p' + piece.color]: true,
        C: piece.isCapstone,
        S: piece.isStanding,
        unplayed: !piece.square,
        firstSelected,
        immovable,
        selectable,
      }"
    />
  </div>
</template>

<script>
const SELECTED_GAP = 3;

export default {
  name: "Piece",
  props: ["game", "id"],
  computed: {
    theme() {
      return this.$store.getters.theme();
    },
    pieceCounts() {
      return this.game.pieceCounts[this.piece.color];
    },
    piece() {
      return this.game.state.pieces.all.byID[this.id];
    },
    immovable() {
      return this.piece.square ? this.piece.isImmovable : false;
    },
    selectable() {
      return (
        !this.piece.square &&
        (this.$store.state.editingTPS ||
          this.piece.color === this.game.state.color)
      );
    },
    firstSelected() {
      return this.piece === this.game.state.selected.pieces[0];
    },
    board3D() {
      return this.$store.state.board3D;
    },
    x() {
      let x = 100;
      if (this.piece.square) {
        x *= this.piece.x;
      } else {
        x *= this.game.size + 0.75 * (this.piece.color === 2);
      }
      return x;
    },
    y() {
      let y = 100;
      let spacing = 7;
      if (this.piece.square) {
        y *= this.piece.y;
        if (!this.board3D) {
          const pieces = this.piece.square.pieces;
          y += spacing * (this.piece.z + this.piece.isSelected * SELECTED_GAP);
          if (
            pieces.length > this.game.size &&
            this.piece.z >= pieces.length - this.game.size
          ) {
            y -= spacing * (pieces.length - this.game.size);
          }
          if (this.piece.isStanding && pieces.length > 1) {
            y -= spacing;
          }
        }
      } else {
        // Unplayed piece
        y = this.game.size - 1;
        if (this.board3D) {
          if (this.piece.type !== "cap") {
            y *=
              Math.floor(
                (this.pieceCounts[this.piece.type] - this.piece.index - 1) /
                  this.game.size
              ) /
              Math.floor(
                this.pieceCounts.flat /
                  (this.game.size -
                    1 *
                      !!(
                        this.pieceCounts.cap &&
                        this.pieceCounts.flat % this.game.size
                      ))
              );
          }
        } else {
          if (this.piece.type === "cap") {
            y *= this.pieceCounts.total - this.piece.index - 1;
          } else {
            y *=
              this.pieceCounts.total -
              this.piece.index -
              this.pieceCounts.cap -
              1;
          }
          y /= this.pieceCounts.total - 1;
          if (this.piece.isSelected) {
            y += (spacing * SELECTED_GAP) / 100;
          }
        }
        y *= 100;
      }
      return y;
    },
    z() {
      let z;
      if (this.piece.square) {
        z = this.piece.z + this.piece.isSelected * SELECTED_GAP;
      } else {
        // Unplayed piece
        if (this.board3D) {
          z =
            (this.pieceCounts[this.piece.type] - this.piece.index - 1) %
            this.game.size;
        } else {
          z =
            (this.pieceCounts.total - this.piece.index) /
            this.pieceCounts.total;
          if (this.piece.type !== "cap") {
            z -= this.pieceCounts.cap;
          }
          if (this.piece.color === 1) {
            z += 1;
          } else {
            z += this.game.size - 1;
          }
        }
        if (this.piece.isSelected) {
          z += SELECTED_GAP;
        }
      }
      return z;
    },
  },
  methods: {
    select(alt = false) {
      if (this.$store.state.editingTPS) {
        let type = this.piece.typeCode;
        if (alt && !this.piece.isCapstone) {
          type = "S";
        }
        this.$store.dispatch("SET_UI", [
          "selectedPiece",
          { color: this.piece.color, type },
        ]);
      } else {
        this.game.selectUnplayedPiece(
          this.piece.type,
          alt || this.piece.isSelected
        );
      }
    },
  },
};
</script>

<style lang="scss">
.piece {
  position: absolute;
  bottom: 0;
  left: 0;
  will-change: transform, opacity;
  transition: transform $generic-hover-transition,
    opacity $generic-hover-transition;

  .stone {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 50%;
    height: 50%;
    margin: 25%;
    box-sizing: border-box;
    border-width: $piece-border-width;
    border-width: var(--piece-border-width);
    border-style: solid;
    border-radius: 10%;
    will-change: opacity, transform, width, height, left, border-radius,
      background-color, box-shadow;
    transition: opacity $generic-hover-transition,
      transform $generic-hover-transition, width $generic-hover-transition,
      height $generic-hover-transition, left $generic-hover-transition,
      border-radius $generic-hover-transition,
      background-color $generic-hover-transition,
      box-shadow $generic-hover-transition;

    .board-container.piece-shadows & {
      box-shadow: 0 0.2vmin 0.4vmin $umbra;
      box-shadow: 0 0.2vmin 0.4vmin var(--q-color-umbra);
      &.firstSelected {
        box-shadow: 0 0.2vmin 0.4vmin $umbra, 0 2.8vmin 1.5vmin $umbra;
        box-shadow: 0 0.2vmin 0.4vmin var(--q-color-umbra),
          0 2.8vmin 1.5vmin var(--q-color-umbra);
      }
    }

    &.p1 {
      background-color: $player1flat;
      background-color: var(--q-color-player1flat);
      border-color: $player1border;
      border-color: var(--q-color-player1border);
    }
    &.p2 {
      background-color: $player2flat;
      background-color: var(--q-color-player2flat);
      border-color: $player2border;
      border-color: var(--q-color-player2border);
    }

    &.S {
      width: 18.75%;
      left: 15%;
      border-radius: 27%/10%;

      &.p1 {
        background-color: $player1special;
        background-color: var(--q-color-player1special);
        transform: rotate(-45deg);
        .board-container.piece-shadows & {
          box-shadow: -1px 1px 2px $umbra;
          box-shadow: -1px 1px 2px var(--q-color-umbra);
          &.firstSelected {
            box-shadow: -1px 1px 2px $umbra, -1.8vmin 1.8vmin 1.5vmin $umbra;
            box-shadow: -1px 1px 2px var(--q-color-umbra),
              -1.8vmin 1.8vmin 1.5vmin var(--q-color-umbra);
          }
        }
      }
      &.p2 {
        background-color: $player2special;
        background-color: var(--q-color-player2special);
        transform: rotate(45deg);
        .board-container.piece-shadows & {
          box-shadow: 1px 1px 2px $umbra;
          box-shadow: 1px 1px 2px var(--q-color-umbra);
          &.firstSelected {
            box-shadow: 1px 1px 2px $umbra, 1.8vmin 1.8vmin 1.5vmin $umbra;
            box-shadow: 1px 1px 2px var(--q-color-umbra),
              1.8vmin 1.8vmin 1.5vmin var(--q-color-umbra);
          }
        }
      }
    }
    &.C {
      border-radius: 50%;
      &.p1 {
        background-color: $player1special;
        background-color: var(--q-color-player1special);
      }
      &.p2 {
        background-color: $player2special;
        background-color: var(--q-color-player2special);
      }
    }

    .board-wrapper:not(.board-3D) &.immovable {
      bottom: 0;
      left: 50%;
      width: 15%;
      height: 8%;
      border-radius: 15%/30%;
    }

    .board-wrapper.board-3D &.immovable {
      opacity: 0.35;
    }

    &.selectable {
      pointer-events: all;
      cursor: pointer;
    }

    &.unplayed {
      .board-container:not(.show-unplayed-pieces) & {
        opacity: 0;
      }
    }
  }
}
</style>
