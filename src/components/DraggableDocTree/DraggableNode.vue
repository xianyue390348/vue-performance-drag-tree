<template>
  <div>
    <div
      :class="['drag-group','drag-item']"
    >
      <!-- 作为分割和子节点的div，不该包含任何该节点的处理 -->
      <!-- 列表成员，节点最基础的div，包含整个节点的内容，包括节点所有的拖拽时间处理 -->
      <div
        :class="{'tree-node': true, 'no-child': !isNoChild, 'active': isActiveNode, 'on-drag': drag}"
        :draggable="canDrag"
        @dragstart="onHandlerDragStart(treeNode, $event)"
        @dragend="onHandlerDragEnd(treeNode, $event)"
        @dragenter="onHandlerDragEnter(treeNode, $event)"
        @dragleave="onHandlerDragLeave(treeNode, $event)"
        @dragover="throttleOnHandleDragOver(treeNode, $event)"
      >
        <div
          class="tree-node-drop-item"
          :style="{'pointer-events: none': enter}"
        >
          <!-- 文档实际显示内容都在这个节点里 -->
          <a
            class="tree-node-link"
            @click.stop="onClickItem(treeNode)">
            <!-- 层级边距 -->
            <span
              @click.stop="onCollapsedToggle(treeNode)"
              :style="{'margin-left':`${16*treeNode['treeLevel']}px`}"
              :class="{'tree-icon': true,'collapsed': !isNodeExpend, 'recycle-icon': treeNode.id === -10001}"
            ></span>
            <!-- 文档内容显示 -->
            <span class="tree-node-title" :title="treeNode.title">
              <span
                class="tree-node-title-content"
              >
                {{ treeNode.title }}</span>
            </span>
            <span class="tree-node-operations">
            </span>
          </a>
          <!-- 文档拖拽指示节点，包含3种情况的边框显示 -->
          <span
            :class="nodeClass"
            class="indicate-span"
            :style="{'padding-left':`${16*treeNode['treeLevel']+6}px`}"
          >
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'

export const lineDirection = {
  lineUp: 1,
  lineDown: 2,
  No: 3
}

export default {
  name: 'DraggableNode',
  inject: ['eventBus', 'tree'],
  components: {
    // RenderFunction,
    // IconFont
  },
  mounted () {
    // 注册eventBus事件
    // 展开所有节点的通知事件
    this.eventBus.on('expend_all_node', () => {
      return !this.isNodeExpend ? this.tree.switchNode(this.treeNode) : null
    })
    // 拖拽结束的通知事件
    // acceptEnter是正常的控件是否接受被进入，
    // 但是Over被preventDefault，不会正常触发leave事件，导致不会变成false，改为拖拽结束后进行全局通知，找到正在被拖拽的节点，该节点为结束节点
    this.eventBus.on('drag_end', () => {
      if (this.acceptEnter) {
        // 该节点为拖拽的结束节点，事件最后触发，通知进行重新排序
        this.acceptEnter = false
        this.tree.onDragEndResort(this)
      }
    })
  },
  data () {
    return {
      // eslint-disable-next-line vue/no-reserved-keys
      _,
      drag: false,
      acceptEnter: false,
      lineDirection: -1,
      // 节流效果不是很好算了
      // throttleOnHandleDragOver: _.throttle(this.onHandlerDragOver, 1000 / 60)
      throttleOnHandleDragOver: this.onHandlerDragOver
    }
  },
  watch: {},
  computed: {
    // 当前节点样式类
    enter () {
      return this.tree.isDragging
    },
    nodeClass () {
      if (this.acceptEnter && this.lineDirection === lineDirection.No) {
        // 拖拽中，仅仅显示边框即可
        // 删除特殊处理
        if (this.treeNode.id === -10001) {
          return ['wiki-tree-drop-indicator', 'drop-indicator-inside', 'drop-indicator-inside-red']
        }
        return ['wiki-tree-drop-indicator', 'drop-indicator-inside']
      }
      if (this.acceptEnter && this.lineDirection === lineDirection.lineUp) {
        // 上面应该出现线
        return ['wiki-tree-drop-indicator', 'wiki-tree-drop-indicator-line', 'drop-indicator-up']
      }
      if (this.acceptEnter && this.lineDirection === lineDirection.lineDown) {
        // 下面应该出现线
        return ['wiki-tree-drop-indicator', 'wiki-tree-drop-indicator-line', 'drop-indicator-down']
      }
      // 啥都没有，就显示默认就行
      return ['wiki-tree-drop-indicator']
    },
    // 节点是否激活, 字体会略有不同
    isActiveNode () {
      return this.isAliveNode
    },
    // 节点是否没有自节点，图标不一样
    isNoChild () {
      return this.treeNode.children && this.treeNode.children.length > 0
    },
    // 是否显示进入节点的边框
    lineEnter () {
      return this.acceptEnter && this.lineDirection === lineDirection.No
    },
    // 是否指示上方向
    lineUp () {
      return this.acceptEnter && this.lineDirection === lineDirection.lineUp
      // return true
    },
    // 是否指示下方向
    lineDown () {
      return this.acceptEnter && this.lineDirection === lineDirection.lineDown
      // return true
    }
  },
  created () {
  },
  methods: {
    onClickItem (treeNode) {
      // 点开文档的时候，如果没有展开，则自动展开
      if (!this.isNodeExpend) {
        this.onCollapsedToggle(treeNode)
      }
      // 负数以下，特殊按钮，通知外部点击
      this.tree.$emit('click', treeNode)
    },
    onCollapsedToggle (treeNode) {
      // 正常情况
      if (treeNode.id !== 0) {
        if (treeNode.children?.length > 0) {
          // 切换节点展开情况
          this.tree.switchNode(this.treeNode)
        }
      }
    },
    commitOrder (payload) {
      this.$emit('commitOrder', payload)
    },
    onHandlerDragStart (treeNode, e) {
      // 拖拽开始，仅仅影响当前元素
      if (treeNode.id && treeNode.id > 0) {
        e.dataTransfer.setDragImage(e.target, 0, 0)
        this.drag = true
        this.tree.setDragStartNode(this.treeNode)
      } else {
        e.preventDefault()
      }
    },
    onHandlerDragEnd (treeNode, e) {
      // 拖拽结束，仅仅影响当前元素
      this.drag = false
      // 这里因为preventDefault的原因，手动通知所有节点结束结束被拖拽
      this.tree.broadcastDragEnd()
    },
    onHandlerDragEnter (treeNode, e) {
      // 拖拽进入，判断是否可以拖拽入，拖拽的坐标
      if (!this.drag) {
        this.acceptEnter = true
      }
    },
    onHandlerDragLeave (treeNode, evt) {
      if (evt.currentTarget.contains(evt.relatedTarget)) {
        return
      }
      // 拖拽进入，判断是否可以拖拽入，拖拽的坐标
      this.acceptEnter = false
    },
    onHandlerDragOver (treeNode, e) {
      // 根据鼠标over的位置，判断应该显示上还是下线
      e.preventDefault()
      // 特殊按钮全部只有接受
      if (treeNode.id <= 0) {
        this.lineDirection = lineDirection.No
        return
      }
      const lineHeight = 38
      const upLimit = lineHeight * 0.33
      const downLimit = lineHeight * 0.66
      if (e.offsetY > downLimit) {
        this.lineDirection = lineDirection.lineDown
      } else if (e.offsetY < upLimit) {
        this.lineDirection = lineDirection.lineUp
      } else {
        this.lineDirection = lineDirection.No
      }
    },
    getValidMenus (item) {
      const result = item.menus.filter((item) => !item.check ? true : item.check(this.treeNode))
      return result
    }
  },
  props: {
    canDrag: {
      type: Boolean,
      required: false,
      default: true
    },
    dragEnable: {
      required: false,
      type: Boolean,
      default: true
    },
    treeNode: {
      type: Object,
      required: true
    },
    operations: {
      type: Array,
      required: true
    },
    isAliveNode: {
      type: Boolean,
      required: false,
      default: () => false
    },
    isNodeExpend: {
      type: Boolean,
      required: false,
      default: () => true
    },
    renderIcon: {
      type: Function,
      required: false,
      default: null
    }
  }
}
</script>

<style scoped lang="less">
@import "draggableNode.less";
</style>
