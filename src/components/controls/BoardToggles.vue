<template>
  <div
    class="board-toggles q-gutter-sm"
    :class="{ row: isPortrait, column: !isPortrait }"
  >
    <FullscreenToggle
      v-if="$q.fullscreen.isCapable"
      @input="$q.fullscreen.toggle()"
      :value="$q.fullscreen.isActive"
      class="dimmed-btn"
      :color="fg"
      dense
      flat
    />
    <q-btn
      @click="board3D = !board3D"
      :icon="board3D ? '2d' : '3d'"
      :title="$t((board3D ? '2' : '3') + 'D Board')"
      class="dimmed-btn"
      :color="fg"
      dense
      flat
    />
  </div>
</template>

<script>
import FullscreenToggle from "./FullscreenToggle";

export default {
  name: "BoardToggles",
  components: { FullscreenToggle },
  computed: {
    fg() {
      return this.$store.state.theme.secondaryDark ? "textLight" : "textDark";
    },
    board3D: {
      get() {
        return this.$store.state.board3D;
      },
      set(value) {
        this.$store.dispatch("SET_UI", ["board3D", value]);
      },
    },
    isPortrait() {
      return this.$store.state.isPortrait;
    },
  },
};
</script>
