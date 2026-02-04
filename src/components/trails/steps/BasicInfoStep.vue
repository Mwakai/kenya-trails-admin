<script setup lang="ts">
import { inject, computed } from 'vue'
import { trailFormKey } from '@/composables/useTrailForm'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'

const ctx = inject(trailFormKey)!

const errors = computed(() => ctx.stepErrors.value[0] || {})

const shortDescCount = computed(() => ctx.formData.short_description.length)

const editor = useEditor({
  content: ctx.formData.description,
  extensions: [
    StarterKit,
    Placeholder.configure({ placeholder: 'Write a detailed trail description...' }),
    CharacterCount,
  ],
  onUpdate: ({ editor: ed }) => {
    ctx.formData.description = ed.getHTML()
  },
})
</script>

<template>
  <div class="step-content">
    <h2 class="step-title">Basic Information</h2>
    <p class="step-subtitle">Enter the trail name and description.</p>

    <div class="form-group">
      <label class="field-label" for="trail-name">Trail Name <span class="required">*</span></label>
      <input
        id="trail-name"
        v-model="ctx.formData.name"
        type="text"
        class="form-input"
        :class="{ 'input-error': errors.name }"
        placeholder="e.g. Mount Kenya Summit Trail"
      />
      <span v-if="errors.name" class="error-msg">{{ errors.name }}</span>
    </div>

    <div class="form-group">
      <label class="field-label" for="short-desc">
        Short Description
        <span class="char-count" :class="{ 'count-over': shortDescCount > 200 }">
          {{ shortDescCount }}/200
        </span>
      </label>
      <textarea
        id="short-desc"
        v-model="ctx.formData.short_description"
        class="form-textarea"
        :class="{ 'input-error': errors.short_description }"
        rows="3"
        placeholder="Brief summary for cards and listings..."
        maxlength="200"
      />
      <span v-if="errors.short_description" class="error-msg">{{ errors.short_description }}</span>
    </div>

    <div class="form-group">
      <label class="field-label">Full Description <span class="required">*</span></label>

      <div v-if="editor" class="editor-wrapper" :class="{ 'input-error': errors.description }">
        <div class="editor-toolbar">
          <button
            class="toolbar-btn"
            :class="{ active: editor.isActive('bold') }"
            title="Bold"
            @click="editor.chain().focus().toggleBold().run()"
          >
            <strong>B</strong>
          </button>
          <button
            class="toolbar-btn"
            :class="{ active: editor.isActive('italic') }"
            title="Italic"
            @click="editor.chain().focus().toggleItalic().run()"
          >
            <em>I</em>
          </button>
          <span class="toolbar-divider" />
          <button
            class="toolbar-btn"
            :class="{ active: editor.isActive('heading', { level: 2 }) }"
            title="Heading"
            @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          >
            H2
          </button>
          <button
            class="toolbar-btn"
            :class="{ active: editor.isActive('heading', { level: 3 }) }"
            title="Subheading"
            @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          >
            H3
          </button>
          <span class="toolbar-divider" />
          <button
            class="toolbar-btn"
            :class="{ active: editor.isActive('bulletList') }"
            title="Bullet List"
            @click="editor.chain().focus().toggleBulletList().run()"
          >
            &bull;
          </button>
          <button
            class="toolbar-btn"
            :class="{ active: editor.isActive('orderedList') }"
            title="Ordered List"
            @click="editor.chain().focus().toggleOrderedList().run()"
          >
            1.
          </button>
        </div>
        <EditorContent :editor="editor" class="editor-content" />
      </div>

      <span v-if="errors.description" class="error-msg">{{ errors.description }}</span>
    </div>
  </div>
</template>

<style scoped>
.step-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 720px;
}

.step-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.step-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: -12px 0 0 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.field-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.required {
  color: var(--color-error);
}

.char-count {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-secondary);
}

.count-over {
  color: var(--color-error);
}

.form-input,
.form-textarea {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-background);
  transition: border-color var(--transition-fast);
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}

.form-textarea {
  resize: vertical;
}

.input-error {
  border-color: var(--color-error) !important;
}

.error-msg {
  font-size: var(--font-size-xs);
  color: var(--color-error);
}

/* TipTap Editor */
.editor-wrapper {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: border-color var(--transition-fast);
}

.editor-wrapper:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-alt);
}

.toolbar-btn {
  padding: var(--space-1) var(--space-2);
  background: none;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  min-width: 28px;
  text-align: center;
  transition: all var(--transition-fast);
}

.toolbar-btn:hover {
  background: var(--color-background);
  color: var(--color-text-primary);
}

.toolbar-btn.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  margin: 0 var(--space-1);
}

.editor-content {
  min-height: 200px;
  padding: var(--space-3);
}

.editor-content :deep(.tiptap) {
  outline: none;
  min-height: 180px;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-primary);
}

.editor-content :deep(.tiptap p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: var(--color-text-secondary);
  pointer-events: none;
  height: 0;
  opacity: 0.5;
}

.editor-content :deep(.tiptap h2) {
  font-size: var(--font-size-lg);
  margin: var(--space-3) 0 var(--space-2) 0;
}

.editor-content :deep(.tiptap h3) {
  font-size: var(--font-size-base);
  margin: var(--space-2) 0 var(--space-1) 0;
}

.editor-content :deep(.tiptap ul),
.editor-content :deep(.tiptap ol) {
  padding-left: var(--space-6);
  margin: var(--space-2) 0;
}
</style>
