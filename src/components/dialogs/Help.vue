<template>
  <large-dialog :value="value" @input="$emit('input', $event)" v-bind="$attrs">
    <template v-slot:header>
      <q-tabs
        v-model="section"
        active-color="primary"
        indicator-color="primary"
        align="justify"
      >
        <q-tab name="about" icon="info" :label="$t('About')" />
        <q-tab name="usage" icon="help" :label="$t('Usage')" />
        <q-tab name="hotkeys" icon="keyboard" :label="$t('Hotkeys')" />
      </q-tabs>
      <smooth-reflow>
        <q-input
          v-show="section === 'hotkeys'"
          v-model="filter"
          class="col-grow"
          clearable
          filled
          square
          dense
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </smooth-reflow>
    </template>

    <div class="help">
      <q-tab-panels v-model="section" animated>
        <q-tab-panel name="about">
          <q-markdown :src="about" no-heading-anchor-links />
        </q-tab-panel>

        <q-tab-panel name="usage">
          <q-markdown :src="usage" no-heading-anchor-links />
        </q-tab-panel>

        <q-tab-panel name="hotkeys">
          <q-markdown no-heading-anchor-links>{{
            $t("Hotkeys") + "\n==="
          }}</q-markdown>
          <Hotkeys ref="hotkeys" v-model="filter" />
        </q-tab-panel>
      </q-tab-panels>
    </div>

    <template v-slot:footer>
      <q-separator />
      <q-card-actions align="right">
        <q-btn :label="$t('Close')" color="primary" flat v-close-popup />
      </q-card-actions>
    </template>
  </large-dialog>
</template>

<script>
import Hotkeys from "../general/Hotkeys.vue";

export default {
  name: "Help",
  components: { Hotkeys },
  props: ["value"],
  data() {
    return {
      about: "",
      usage: "",
      filter: "",
    };
  },
  computed: {
    section: {
      get() {
        return this.$route.params.section || "about";
      },
      set(section) {
        this.$router.replace({ params: { section } });
      },
    },
  },
  created() {
    import(`../../i18n/${this.$i18n.locale}/about.md`)
      .then((about) => {
        this.about = about.default;
      })
      .catch((error) => {
        console.log(error);
        import(`../../i18n/${this.$i18n.fallbackLocale}/about.md`).then(
          (about) => {
            this.about = about.default;
          }
        );
      });
    import(`../../i18n/${this.$i18n.locale}/usage.md`)
      .then((usage) => {
        this.usage = usage.default;
      })
      .catch((error) => {
        console.log(error);
        import(`../../i18n/${this.$i18n.fallbackLocale}/usage.md`).then(
          (usage) => {
            this.usage = usage.default;
          }
        );
      });
  },
};
</script>

<style lang="scss">
.help {
  h6 {
    margin-top: 0;
    margin-bottom: 1em;
    ~ h6 {
      margin-top: 1.5em;
    }
  }

  .q-markdown {
    .q-markdown--link {
      color: $primary;
      color: var(--q-color-primary);
      border-bottom: none;
      text-decoration: underline;
      &.q-markdown--link-external:after {
        content: "\F03CC";
        font-family: "Material Design Icons";
      }

      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>
