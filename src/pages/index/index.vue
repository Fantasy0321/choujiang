<template>
  <view>
    <image src="https://cdn.vrupup.com/s/1747/default_avatar.png" />

    <u-icon size="64rpx" :name="a <= b ? 'https://cdn.vrupup.com/s/1747/b4a7d8391dc64d82e65d7691b427fb35.png' : 'https://cdn.vrupup.com/s/1747/05ac170f380948ef680bd9ca562f7497.png'" />
  </view>
</template>

<script setup>
const a = 1
const b = 2
</script>

<style scoped lang="scss">
.page {
  background-image: url(https://cdn.vrupup.com/s/1747/893fcdc49e84364da9e81650854b4a84.png);
}
</style>