<script setup lang="ts">
import type { AgendaItem } from '../types/event'

defineProps<{ item: AgendaItem }>()

function cleanSpeaker(s?: string): string {
  return s ? s.replace(/_/g, ' ') : ''
}
</script>

<template>
  <div class="pa__item-content">
    <span class="pa__num">{{ item.number != null ? item.number : '·' }}</span>

    <div class="pa__item-body">
      <div class="pa__item-head">
        <span class="pa__item-title">{{ item.title }}</span>
        <span v-if="item.speaker" class="pa__speaker">{{ cleanSpeaker(item.speaker) }}</span>
        <span v-if="item.n_doc" class="pa__ndoc">{{ item.n_doc }}</span>
      </div>

      <p v-if="item.note" class="pa__item-note">{{ item.note }}</p>

      <ol v-if="item.subitems && item.subitems.length" class="pa__subs">
        <li
          v-for="(sub, i) in item.subitems"
          :key="i"
          class="pa__sub"
        >
          <span v-if="sub.number != null" class="pa__sub-num">{{ sub.number }}</span>
          <div class="pa__sub-body">
            <div class="pa__sub-head">
              <span class="pa__sub-title">{{ sub.title }}</span>
              <span v-if="sub.speaker" class="pa__speaker">{{ cleanSpeaker(sub.speaker) }}</span>
              <span v-if="sub.n_doc" class="pa__ndoc">{{ sub.n_doc }}</span>
            </div>
            <p v-if="sub.note" class="pa__sub-note">{{ sub.note }}</p>

            <ol v-if="sub.subitems && sub.subitems.length" class="pa__subs pa__subs--deep">
              <li
                v-for="(deep, di) in sub.subitems"
                :key="di"
                class="pa__sub pa__sub--deep"
              >
                <span v-if="deep.number != null" class="pa__sub-num pa__sub-num--deep">{{ deep.number }}</span>
                <div class="pa__sub-body">
                  <div class="pa__sub-head">
                    <span class="pa__sub-title pa__sub-title--deep">{{ deep.title }}</span>
                    <span v-if="deep.speaker" class="pa__speaker">{{ cleanSpeaker(deep.speaker) }}</span>
                    <span v-if="deep.n_doc" class="pa__ndoc">{{ deep.n_doc }}</span>
                  </div>
                </div>
              </li>
            </ol>
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>
