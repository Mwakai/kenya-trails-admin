<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Real column headers, so the placeholder matches the loaded table */
    columns?: string[]
    variant?: 'table' | 'grid'
    rows?: number
    label?: string
  }>(),
  {
    columns: () => [],
    variant: 'table',
    rows: 8,
    label: 'Loading',
  },
)

// Varied bar widths so rows don't read as a flat block
const widths = ['72%', '48%', '60%', '36%', '54%', '40%']
const barWidth = (row: number, col: number) => widths[(row + col) % widths.length]
</script>

<template>
  <div class="skeleton-list" role="status" aria-busy="true" :aria-label="label">
    <div v-if="variant === 'table'" class="skeleton-table-container">
      <table class="skeleton-table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row" :style="{ '--row': row }">
            <td v-for="(col, colIndex) in columns" :key="col">
              <template v-if="colIndex === 0">
                <span class="skeleton skeleton-line" :style="{ width: barWidth(row, 0) }" />
                <span class="skeleton skeleton-line skeleton-line-sub" />
              </template>
              <span v-else class="skeleton skeleton-line" :style="{ width: barWidth(row, colIndex) }" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="skeleton-grid">
      <div v-for="row in rows" :key="row" class="skeleton-card" :style="{ '--row': row }">
        <span class="skeleton skeleton-card-image" />
        <div class="skeleton-card-body">
          <span class="skeleton skeleton-line" :style="{ width: barWidth(row, 0) }" />
          <span class="skeleton skeleton-line skeleton-line-sub" />
          <span class="skeleton skeleton-line skeleton-line-sub" :style="{ width: '30%' }" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Frame mirrors .table-container / card styles on the list pages */
.skeleton-table-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.skeleton-table {
  width: 100%;
  border-collapse: collapse;
}

.skeleton-table th,
.skeleton-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.skeleton-table th {
  background: var(--color-background-alt);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-normal);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.skeleton-table tbody tr:last-child td {
  border-bottom: none;
}

.skeleton-line {
  height: var(--space-3);
}

.skeleton-line-sub {
  width: 40%;
  height: var(--space-2);
  margin-top: var(--space-2);
}

/* Stagger the shimmer row by row so the sweep reads top to bottom */
.skeleton-table tbody tr .skeleton,
.skeleton-card .skeleton {
  animation-delay: calc(var(--row) * 80ms);
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.skeleton-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.skeleton-card-image {
  height: 180px;
  border-radius: 0;
}

.skeleton-card-body {
  padding: var(--space-4);
}

@media (max-width: 1024px) {
  .skeleton-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .skeleton-grid {
    grid-template-columns: 1fr;
  }

  .skeleton-table-container {
    overflow-x: auto;
  }
}
</style>
