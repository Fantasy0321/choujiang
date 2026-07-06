<template>
  <view class="activity">
    <view v-if="screen === 'loading'" class="stage">
      <skin-image v-for="layer in layers.loading" :key="layer.name" v-bind="layer" />
      <view class="progress-clip">
        <skin-image folder="loading" name="loading_2" :x="0" :y="0" :w="479" :h="23" />
      </view>
    </view>

    <view v-else-if="screen === 'home'" class="stage">
      <skin-image v-for="layer in layers.home" :key="layer.name" v-bind="layer" />
      <view class="tap-area start-area" @tap="openRule" />
    </view>

    <view v-else-if="screen === 'time'" class="stage">
      <skin-image v-for="layer in layers.time" :key="layer.name" v-bind="layer" />
      <view class="tap-area time-rule-area" @tap="openRule" />
      <view class="tap-area time-checkin-area" @tap="openDaka" />
      <view class="tap-area punch-area" @tap="openDaka" />
    </view>

    <view v-else-if="screen === 'daka'" class="stage">
      <skin-image v-for="layer in dakaLayers" :key="layer.name + layer.x + layer.y" v-bind="layer" />
      <view class="tap-area close-daka-area" @tap="backToTime" />
      <view class="tap-area sign-area" @tap="doCheckin" />
    </view>

    <view v-else-if="screen === 'lottery'" class="stage">
      <skin-image v-for="layer in lotteryLayers" :key="layer.name" v-bind="layer" />
      <view
        v-for="(cell, index) in lotteryCells"
        :key="cell.key"
        class="lottery-highlight"
        :class="{ active: activePrizeIndex === index }"
        :style="cellStyle(cell)"
      />
      <view class="tap-area draw-area" @tap="startDraw" />
    </view>

    <view v-else-if="screen === 'prizeResult'" class="stage">
      <skin-image v-for="layer in layers.prizeResult" :key="layer.name" v-bind="layer" />
      <view class="result-prize-name">{{ state.prizeName || '奖品名称' }}</view>
      <view class="tap-area fill-area" @tap="openMessage" />
    </view>

    <view v-else-if="screen === 'message'" class="stage">
      <skin-image v-for="layer in layers.message" :key="layer.name" v-bind="layer" />
      <input v-model="claimForm.receiverName" class="form-input name-input" />
      <input v-model="claimForm.receiverPhone" class="form-input phone-input" type="number" />
      <input v-model="claimForm.receiverAddress" class="form-input address-input" />
      <view class="tap-area close-message-area" @tap="screen = 'prizeResult'" />
      <view class="tap-area submit-area" @tap="submitClaim" />
    </view>

    <view v-else-if="screen === 'poster'" class="stage">
      <skin-image v-for="layer in layers.poster" :key="layer.name" v-bind="layer" />
      <view class="poster-name">{{ state.nickname || '用户昵称' }}</view>
      <view class="poster-prize">{{ state.prizeName || '扫码参与活动' }}</view>
      <view class="tap-area poster-draw-area" @tap="goLottery" />
    </view>

    <view v-if="showRule" class="modal-mask">
      <view class="stage">
        <skin-image v-for="layer in layers.rule" :key="layer.name" v-bind="layer" />
        <view class="tap-area rule-confirm-area" @tap="enterTime" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { checkin, claimPrize, drawPrize, getActivityState } from '@/api/activity'

const px = value => `${Number(value) / 2}px`

const SkinImage = defineComponent({
  props: {
    folder: { type: String, required: true },
    name: { type: String, required: true },
    x: { type: [String, Number], default: 0 },
    y: { type: [String, Number], default: 0 },
    w: { type: [String, Number], required: true },
    h: { type: [String, Number], required: true },
  },
  setup(props) {
    return () =>
      h('img', {
        class: 'skin-img',
        src: `/static/activity/${props.folder}/${props.name}.png`,
        style: {
          left: px(props.x),
          top: px(props.y),
          width: px(props.w),
          height: px(props.h),
        },
      })
  },
})

const img = (folder, name, x, y, w, h) => ({ folder, name, x, y, w, h })

const layers = {
  loading: [
    img('loading', 'loading_6', 0, 0, 750, 1624),
    img('loading', 'loading_5', 0, 437, 750, 330),
    img('loading', 'loading_4', 283, 980, 185, 26),
    img('loading', 'loading_3', 143, 909, 486, 29),
    img('loading', 'loading_1', 240, 295, 270, 66),
  ],
  home: [
    img('index', 'index_7', 0, 0, 750, 1624),
    img('index', 'index_6', 187, 830, 407, 398),
    img('index', 'index_5', 139, 1339, 479, 27),
    img('index', 'index_4', 0, 690, 750, 77),
    img('index', 'index_3', 39, 437, 672, 255),
    img('index', 'index_2', 240, 295, 270, 66),
    img('index', 'index_1', 180, 1213, 390, 91),
  ],
  rule: [
    img('rule', 'rule_4', 0, 0, 750, 1624),
    img('rule', 'rule_3', 0, 0, 750, 1624),
    img('rule', 'rule_2', 89, 252, 579, 897),
    img('rule', 'rule_1', 258, 1191, 243, 64),
  ],
  time: [
    img('time1', 'time1_10', 0, 0, 750, 1624),
    img('time1', 'time1_9', 72, 369, 605, 1097),
    img('time1', 'time1_8', 0, 1108, 750, 516),
    img('time1', 'time1_7', 218, 1038, 312, 524),
    img('time1', 'time1_6', 316, 1005, 117, 28),
    img('time1', 'time1_5', 100, 379, 552, 329),
    img('time1', 'time1_4', 216, 795, 316, 87),
    img('time1', 'time1_3', 616, 288, 134, 53),
    img('time1', 'time1_2', 616, 218, 134, 53),
    img('time1', 'time1_1', 240, 218, 270, 66),
  ],
  daka: [
    img('daka', 'daka_21', 0, 0, 750, 1624),
    img('daka', 'daka_20', 0, 0, 750, 1624),
    img('daka', 'daka_19', 73, 571, 605, 482),
    img('daka', 'daka_18', 118, 674, 117, 142),
    img('daka', 'daka_17', 136, 686, 69, 79),
    img('daka', 'daka_16', 251, 674, 116, 142),
    img('daka', 'daka_15', 268, 686, 69, 79),
    img('daka', 'daka_14', 383, 674, 117, 142),
    img('daka', 'daka_13', 401, 686, 69, 79),
    img('daka', 'daka_12', 516, 674, 116, 142),
    img('daka', 'daka_11', 533, 686, 69, 79),
    img('daka', 'daka_10', 118, 835, 117, 142),
    img('daka', 'daka_9', 136, 847, 69, 79),
    img('daka', 'daka_8', 251, 835, 116, 142),
    img('daka', 'daka_7', 268, 847, 69, 79),
    img('daka', 'daka_6', 384, 835, 248, 142),
    img('daka', 'daka_5', 458, 833, 88, 100),
    img('daka', 'daka_4', 242, 1111, 268, 71),
    img('daka', 'daka_3', 620, 494, 57, 57),
  ],
  lottery: [
    img('prize', 'prize_14', 0, 0, 750, 1624),
    img('prize', 'prize_13', 42, 570, 675, 682),
    img('prize', 'prize_12', 288, 811, 204, 204),
    img('prize', 'prize_10', 124, 817, 192, 191),
    img('prize', 'prize_9', 294, 647, 192, 192),
    img('prize', 'prize_8', 294, 987, 192, 191),
    img('prize', 'prize_7', 464, 647, 192, 192),
    img('prize', 'prize_6', 124, 647, 192, 192),
    img('prize', 'prize_5', 124, 987, 192, 191),
    img('prize', 'prize_4', 464, 817, 192, 191),
    img('prize', 'prize_3', 464, 987, 192, 191),
    img('prize', 'prize_2', 39, 348, 672, 255),
    img('prize', 'prize_1', 240, 218, 270, 66),
  ],
  prizeResult: [
    img('prize1', 'prize1_8', 0, 0, 750, 1624),
    img('prize1', 'prize1_7', 42, 570, 675, 706),
    img('prize1', 'prize1_6', 324, 1046, 104, 26),
    img('prize1', 'prize1_5', 39, 348, 672, 255),
    img('prize1', 'prize1_4', 240, 218, 270, 66),
    img('prize1', 'prize1_3', 254, 1117, 243, 65),
    img('prize1', 'prize1_2', 164, 750, 403, 291),
    img('prize1', 'prize1_1', 150, 749, 452, 300),
  ],
  message: [
    img('massege', 'massege_11', 0, 0, 750, 1624),
    img('massege', 'massege_10', 0, 0, 750, 1624),
    img('massege', 'massege_9', 111, 503, 537, 564),
    img('massege', 'massege_8', 160, 695, 109, 25),
    img('massege', 'massege_7', 301, 682, 306, 47),
    img('massege', 'massege_6', 301, 757, 306, 47),
    img('massege', 'massege_5', 301, 832, 306, 47),
    img('massege', 'massege_4', 160, 768, 108, 25),
    img('massege', 'massege_3', 161, 845, 107, 25),
    img('massege', 'massege_2', 591, 429, 57, 57),
    img('massege', 'massege_1', 242, 1111, 268, 71),
  ],
  poster: [
    img('poster', 'poster_11', 0, 0, 750, 1624),
    img('poster', 'poster_10', 35, 294, 715, 1330),
    img('poster', 'poster_9', 51, 519, 649, 594),
    img('poster', 'poster_8', 65, 1141, 71, 73),
    img('poster', 'poster_7', 146, 1162, 119, 30),
    img('poster', 'poster_6', 66, 1226, 359, 84),
    img('poster', 'poster_5', 146, 1201, 168, 1),
    img('poster', 'poster_4', 546, 1138, 147, 174),
    img('poster', 'poster_3', 551, 1144, 136, 135),
    img('poster', 'poster_2', 228, 1401, 298, 27),
    img('poster', 'poster_1', 251, 200, 249, 60),
  ],
}

const screen = ref('loading')
const showRule = ref(false)
const activePrizeIndex = ref(-1)
const drawing = ref(false)
const urlUserId = ref('')
const state = reactive({})
const claimForm = reactive({
  receiverName: '',
  receiverPhone: '',
  receiverAddress: '',
})

const lotteryCells = [
  { key: '0', x: 124, y: 647, w: 192, h: 192 },
  { key: '1', x: 294, y: 647, w: 192, h: 192 },
  { key: '2', x: 464, y: 647, w: 192, h: 192 },
  { key: '3', x: 464, y: 817, w: 192, h: 191 },
  { key: '4', x: 464, y: 987, w: 192, h: 191 },
  { key: '5', x: 294, y: 987, w: 192, h: 191 },
  { key: '6', x: 124, y: 987, w: 192, h: 191 },
  { key: '7', x: 124, y: 817, w: 192, h: 191 },
]

const userPayload = computed(() => ({
  id: urlUserId.value,
  visitorId: urlUserId.value,
  nickname: uni.getStorageSync('activity_nickname') || '用户昵称',
  avatarUrl: uni.getStorageSync('activity_avatar') || '',
}))

const dakaLayers = computed(() => {
  const checked = Math.min(Number(state.checkinDays || 0), 7)
  const isSeventhChecked = checked >= 7
  const marks = [
    [118, 674],
    [251, 674],
    [383, 674],
    [516, 674],
    [118, 835],
    [251, 835],
  ]
  const baseLayers = isSeventhChecked ? layers.daka.filter(layer => layer.name !== 'daka_5') : layers.daka
  return [
    ...baseLayers,
    ...marks.slice(0, checked).map(([x, y]) => img('daka', 'daka_2', x, y, 117, 142)),
    ...marks.slice(0, checked).map(([x, y]) => img('daka', 'daka_1', x + 28, y + 43, 57, 57)),
    ...(isSeventhChecked
      ? [
          img('daka', 'daka_2', 384, 835, 248, 142),
          img('daka', 'daka_1', 479, 878, 57, 57),
        ]
      : []),
  ]
})

const lotteryLayers = computed(() => {
  return layers.lottery.map(layer => {
    if (layer.name === 'prize_12') {
      return {
        ...layer,
        name: state.drawAvailable ? 'prize_11' : 'prize_12',
      }
    }
    return layer
  })
})

onLoad(options => {
  urlUserId.value = resolveUrlUserId(options)
})

onMounted(() => {
  if (!urlUserId.value) {
    urlUserId.value = resolveUrlUserId()
  }
  boot()
})

function boot() {
  setTimeout(() => {
    screen.value = 'home'
    refreshState()
  }, 900)
}

function resolveUrlUserId(options = {}) {
  if (options.id) {
    return String(options.id)
  }
  if (typeof window === 'undefined') {
    return ''
  }

  const searchId = new URLSearchParams(window.location.search).get('id')
  if (searchId) {
    return searchId
  }

  const hash = window.location.hash || ''
  const queryIndex = hash.indexOf('?')
  if (queryIndex >= 0) {
    return new URLSearchParams(hash.slice(queryIndex + 1)).get('id') || ''
  }
  return ''
}

async function refreshState() {
  if (!urlUserId.value) {
    uni.showToast({ title: '缺少用户id', icon: 'none' })
    return
  }
  try {
    const res = await getActivityState(userPayload.value)
    assignState(res.data.data)
  } catch (error) {
    uni.showToast({ title: '活动状态加载失败', icon: 'none' })
  }
}

function assignState(data = {}) {
  Object.assign(state, data)
}

function openRule() {
  showRule.value = true
}

function enterTime() {
  showRule.value = false
  screen.value = 'time'
}

function openDaka() {
  screen.value = 'daka'
}

function backToTime() {
  screen.value = 'time'
}

async function doCheckin() {
  if (!urlUserId.value) {
    uni.showToast({ title: '缺少用户id', icon: 'none' })
    return
  }

  if (state.checkedToday) {
    uni.showToast({ title: '今日已签到', icon: 'none' })
    if (state.drawAvailable) {
      screen.value = 'lottery'
    }
    return
  }

  try {
    const res = await checkin(userPayload.value)
    assignState(res.data.data)
    uni.showToast({ title: '签到成功', icon: 'none' })
    setTimeout(() => {
      screen.value = 'poster'
    }, 450)
  } catch (error) {
    uni.showToast({ title: error?.data?.msg || '签到失败', icon: 'none' })
  }
}

function goLottery() {
  screen.value = 'lottery'
}

async function startDraw() {
  if (drawing.value) return
  if (!urlUserId.value) {
    uni.showToast({ title: '缺少用户id', icon: 'none' })
    return
  }

  if (state.prizeStatus) {
    screen.value = 'prizeResult'
    return
  }

  if (!state.drawAvailable) {
    uni.showToast({ title: '累计签到7天后可抽奖', icon: 'none' })
    return
  }

  drawing.value = true
  try {
    const res = await drawPrize(userPayload.value)
    const data = res.data.data || {}
    const target = Number.isInteger(data.prizeIndex) ? data.prizeIndex % lotteryCells.length : 0
    await spinTo(target)
    assignState(data)
    screen.value = 'prizeResult'
  } catch (error) {
    uni.showToast({ title: error?.data?.msg || '抽奖失败', icon: 'none' })
  } finally {
    drawing.value = false
  }
}

function spinTo(target) {
  return new Promise(resolve => {
    let step = 0
    const total = 24 + target
    const timer = setInterval(() => {
      activePrizeIndex.value = step % lotteryCells.length
      step += 1
      if (step > total) {
        clearInterval(timer)
        activePrizeIndex.value = target
        setTimeout(resolve, 280)
      }
    }, 70)
  })
}

function openMessage() {
  if (state.prizeStatus === 'SUBMITTED') {
    uni.showToast({ title: '信息已提交', icon: 'none' })
    return
  }
  screen.value = 'message'
}

async function submitClaim() {
  if (!urlUserId.value) {
    uni.showToast({ title: '缺少用户id', icon: 'none' })
    return
  }

  if (!claimForm.receiverName || !claimForm.receiverPhone || !claimForm.receiverAddress) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }

  try {
    const res = await claimPrize({ ...userPayload.value, ...claimForm })
    assignState(res.data.data)
    uni.showToast({ title: '提交成功', icon: 'none' })
    screen.value = 'prizeResult'
  } catch (error) {
    uni.showToast({ title: error?.data?.msg || '提交失败', icon: 'none' })
  }
}

function cellStyle(cell) {
  return {
    left: px(cell.x),
    top: px(cell.y),
    width: px(cell.w),
    height: px(cell.h),
  }
}
</script>

<style scoped lang="scss">
.activity {
  min-height: 100vh;
  background: #f8e6b8;
}

.stage {
  position: relative;
  width: 375px;
  height: 812px;
  margin: 0 auto;
  overflow: hidden;
}

.skin-img {
  position: absolute;
  display: block;
  pointer-events: none;
}

.tap-area {
  position: absolute;
  z-index: 10;
}

.start-area {
  left: 90px;
  top: 606.5px;
  width: 195px;
  height: 45.5px;
}

.time-rule-area {
  left: 308px;
  top: 109px;
  width: 67px;
  height: 26.5px;
}

.time-checkin-area {
  left: 308px;
  top: 144px;
  width: 67px;
  height: 26.5px;
}

.punch-area {
  left: 108px;
  top: 397.5px;
  width: 158px;
  height: 43.5px;
}

.close-daka-area,
.close-message-area {
  left: 295.5px;
  top: 214.5px;
  width: 45px;
  height: 45px;
}

.close-daka-area {
  left: 310px;
  top: 247px;
}

.sign-area,
.submit-area {
  left: 121px;
  top: 555.5px;
  width: 134px;
  height: 35.5px;
}

.draw-area {
  left: 144px;
  top: 405.5px;
  width: 102px;
  height: 102px;
}

.fill-area {
  left: 127px;
  top: 558.5px;
  width: 121.5px;
  height: 32.5px;
}

.poster-draw-area {
  left: 114px;
  top: 700.5px;
  width: 149px;
  height: 45px;
}

.rule-confirm-area {
  left: 129px;
  top: 595.5px;
  width: 121.5px;
  height: 32px;
}

.progress-clip {
  position: absolute;
  left: 72.5px;
  top: 455.5px;
  z-index: 2;
  width: 239.5px;
  height: 11.5px;
  overflow: hidden;
  border-radius: 99px;
  animation: loading-bar .9s linear forwards;
}

.progress-clip .skin-img {
  position: absolute;
}

@keyframes loading-bar {
  from {
    width: 0;
  }
  to {
    width: 239.5px;
  }
}

.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 20;
  overflow-y: auto;
  background: rgba(22, 20, 14, .72);
}

.lottery-highlight {
  position: absolute;
  z-index: 5;
  box-sizing: border-box;
  border: 3px solid transparent;
  border-radius: 9px;
}

.lottery-highlight.active {
  border-color: #d91d17;
  box-shadow: 0 0 11px rgba(217, 29, 23, .6);
}

.result-prize-name {
  position: absolute;
  left: 60px;
  top: 519px;
  z-index: 6;
  width: 255px;
  color: #8b6232;
  font-size: 14px;
  line-height: 19px;
  text-align: center;
}

.form-input {
  position: absolute;
  left: 161px;
  z-index: 12;
  width: 125px;
  height: 23.5px;
  padding: 0 7px;
  box-sizing: border-box;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #7d5730;
  font-size: 12px;
  line-height: 23.5px;
}

.name-input {
  top: 341px;
}

.phone-input {
  top: 378.5px;
}

.address-input {
  top: 416px;
}

.poster-name,
.poster-prize {
  position: absolute;
  z-index: 6;
  color: #8a6332;
  font-size: 12px;
  line-height: 16px;
}

.poster-name {
  left: 138px;
  top: 580px;
  width: 120px;
}

.poster-prize {
  left: 274px;
  top: 585px;
  width: 68px;
  min-height: 48px;
  text-align: center;
}
</style>
