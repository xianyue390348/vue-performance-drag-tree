<template>
  <div>
    <RecycleScroller
      class="scroller"
      :items="getFlatChildren(treeData.children)"
      :item-size="38"
      key-field="id"
      v-slot="{ item }"
      :buffer="400"
      :prerender="20"
      style="height: 100%"
    >
      <draggable-node
        :key="item.id"
        :tree-node="item"
        :can-drag="canDrag"
        :expandChild="true"
        v-bind="$attrs"
        :is-node-expend="isNodeExpend(item)"
        :is-alive-node="isNodeAlive(item)"
        :operations="[]">
      </draggable-node>
    </RecycleScroller>
  </div>
</template>

<script>
import DraggableNode from '@/components/DraggableDocTree/DraggableNode'
import lodash from 'lodash'
import { iterateTree } from '@/utils/util'
import mitt from 'mitt';
import { RecycleScroller } from 'vue-virtual-scroller'


export const lineDirection = {
  lineUp: 1,
  lineDown: 2,
  No: 3
}

const eventBus = mitt();

export default {
  name: 'DraggableDocTree',
  components: { DraggableNode, RecycleScroller },
  data () {
    return {
      dragStartNode: {},
      isDragging: false,

      innerExpendNode: {},
      innerActiveNode: null
    }
  },
  created () {
  },
  mounted () {
    // 展开选中节点的父节点
    this.initMap()
    if (this.aliveId) {
      this.expendNodeParent(this.getNodeByID(this.aliveId))
    }
  },
  watch: {
    treeData () {
      this.initMap()
      if (this.aliveId) {
        this.expendNodeParent(this.getNodeByID(this.aliveId))
        this.activeNode(this.getNodeByID(this.aliveId))
      }
    },
    aliveId (val, oldVal) {
      if (this.aliveId) {
        this.expendNodeParent(this.getNodeByID(this.aliveId))
        this.activeNode(this.getNodeByID(this.aliveId))
      }
    }
  },
  computed: {},
  methods: {
    delete (target) {
      iterateTree(this.treeData, node => {
        if (node.id === target.parent_id) {
          node.children = node.children.filter((node) => node.id !== target.id)
        }
      })
    },
    getFlatChildren (data) {
      if (!data) {
        return []
      }
      const result = []
      for (let i = 0; i < data.length; i++) {
        const currentData = data[i]
        result.push(currentData)
        if (currentData.children && this.isNodeExpend(currentData)) {
          result.push(this.getFlatChildren(currentData.children))
        }
      }
      // console.log(lodash.flattenDeep(result).length)
      return lodash.flattenDeep(result)
    },
    initMap () {
      iterateTree(this.treeData, (node, dep, brotherTree) => {
        node.brotherTree = brotherTree
        node.isNodeExpend = true
        node.treeLevel = 9999 -1 - dep
        if (this.defaultExpendAll) {
          this.addExpendNode(node)
        }
      })

      let isValidID = false
      if (this.aliveId) {
        iterateTree(this.treeData, (node, dep, brotherTree) => {
          if (node.id === this.aliveId) {
            isValidID = true
          }
        })
      } else {
        isValidID = true
      }

      if (this.defaultActiveFirst && this.treeData?.children?.length && !this.innerActiveNode && (!this.aliveId || !isValidID)) {
        this.activeNode(this.treeData.children[0])
        this.$emit('click', this.treeData.children[0])
      }
    },
    emptyActiveNode () {
      this.innerActiveNode = null
    },
    getNodeByID (id) {
      let result = null
      iterateTree(this.treeData, node => {
        if (node.id === id) {
          result = node
        }
      })
      return result
    },
    activeNode (node) {
      this.innerActiveNode = node
      this.expendNodeParent(node)
    },
    // 展节点的父节点
    expendNodeParent (node) {
      let tmp = node
      // eslint-disable-next-line camelcase
      while (tmp?.parent_id) {
        tmp = this.getNodeByID(tmp.parent_id)
        if (!this.isNodeExpend(tmp)) {
          this.addExpendNode(tmp)
        }
      }
    },
    // 节点是否展开
    isNodeExpend (node) {
      return node && !!this.innerExpendNode[node.id]
    },
    // 展开指定层级的节点
    expendLevelNode (level = 9999) {
      iterateTree(
          this.treeData,
          node => {
            if (!this.isNodeExpend(node) && node.children && node.children.length > 0) {
              this.addExpendNode(node)
            }
          },
          level
      )
    },
    // 取消展开所有节点
    clearExpend () {
      this.innerExpendNode = {}
    },
    // 切换节点状态
    switchNode (node) {
      this.isNodeExpend(node) ? this.deleteExpendNode(node) : this.addExpendNode(node)
    },
    addExpendNode (node) {
      if(node?.id) {
        this.innerExpendNode[node.id] = true
      }
    },
    deleteExpendNode (node) {
      if(node?.id) {
        this.innerExpendNode[node.id] = false
      }
    },
    setDragStartNode (node) {
      this.dragStartNode = node
    },
    // 通知所有节点拖拽结束，进一步找到是谁作为拖拽结束的节点
    broadcastDragEnd (node) {
      this.isDragging = false
      eventBus.emit('drag_end')
    },
    // 节点拖拽结束的通知，node为结束节点位置，开始节点位置为dragStartNode
    onDragEndResort (ref) {
      // parent_id: 拖拽结果的父节点id
      // drag_wiki_id: 拖拽节点id
      // before_sort: 拖拽结果的前面节点的order值
      // after_sort: 拖拽结果的后面节点的order值
      // 如果被拖拽节点是负数，说明是特殊节点，比如回收站，直接通知上层即可
      const node = ref.treeNode
      if (node.id < 0) {
        this.$emit('onDragEnd', this.dragStartNode, node)
        return
      }

      const sourceNode = this.dragStartNode
      const targetNode = node

      // 该节点的最后一个子节点
      const getTreeNodeLastOne = treeNode => {
        if (!treeNode['children'] || treeNode['children'].length === 0) {
          return 0
        }
        const index = treeNode['children'].length - 1
        return treeNode['children'][index]['sort']
      }

      const getBeforeNode = (treeNode, targetNode) => {
        const node = treeNode.treeNode['brotherTree']
        for (let i = 0; i < node.length; i++) {
          if (node[i].id === targetNode.id) {
            return i === 0 ? 0 : node[i - 1].sort
          }
        }
      }

      const getAfterNode = (treeNode, targetNode) => {
        const node = treeNode.treeNode['brotherTree']
        for (let i = 0; i < node.length; i++) {
          if (node[i].id === targetNode.id) {
            return i === node.length - 1 ? 0 : node[i + 1].sort
          }
        }
      }

      const dragWikiID = sourceNode['id']
      let parentID
      let beforeSort
      let afterSort = 0

      // 拖拽点在目标里
      if (ref.lineDirection === lineDirection.No) {
        parentID = targetNode['id']
        beforeSort = getTreeNodeLastOne(targetNode)
        afterSort = 0
      }

      // 拖拽点在目标头上
      if (ref.lineDirection === lineDirection.lineUp) {
        parentID = targetNode['parent_id']
        beforeSort = getBeforeNode(ref, ref.treeNode)
        afterSort = targetNode['sort']
      }

      // 拖拽点在目标下面
      if (ref.lineDirection === lineDirection.lineDown) {
        parentID = targetNode['parent_id']
        beforeSort = targetNode['sort']
        afterSort = getAfterNode(ref, ref.treeNode)
      }

      // 上面数据用于请求后端排序接口
      beforeSort = beforeSort !== 0 ? beforeSort : afterSort + 1
      const requestData = {
        parent_id: parentID,
        drag_wiki_id: dragWikiID,
        before_sort: beforeSort,
        after_sort: afterSort
      }
      // 重新排序结果
      const preSort = (beforeSort + afterSort) / 2
      if (this.sortCheck && !this.sortCheck({ treeNode: sourceNode, newParent: parentID, newSort: preSort }, targetNode)) {
        return
      }

      this.$emit('requestSort', requestData)

      const newTreeData = this.resortTree({ treeNode: sourceNode, newParent: parentID, newSort: preSort })
      // 通知外部节点请求后端进行重新排序
      this.$emit('resort', newTreeData)
    },
    resortTree ({ treeNode, newParent, newSort }) {
      const tmpTreeNode = { ...treeNode }
      // 1.修改当前节点的sort，parent
      tmpTreeNode['sort'] = newSort
      const tmpNode = this.treeData
      // 2.父节点中移除自己
      iterateTree(tmpNode, node => {
        if (node['id'] === tmpTreeNode['parent_id']) {
          node.children = node.children.filter(item => item.id !== tmpTreeNode.id)
        }
      })
      // 3.新父节点中添加自己
      iterateTree(tmpNode, node => {
        if (node['id'] === newParent) {
          tmpTreeNode['parent_id'] = newParent
          tmpTreeNode['treeLevel'] = node.treeLevel + 1
          tmpTreeNode['brotherTree'] = node.children
          node.children.push(tmpTreeNode)

          iterateTree(tmpTreeNode, (node, dep, brotherTree) => {
            // 前面为正常level排序， 后面加上父节点sort值
            node['treeLevel'] = 9999 - dep - 1 + tmpTreeNode['treeLevel'] + 1
          })
        }
      })
      // 遍历排序
      iterateTree(tmpNode, item => item.children.sort((a, b) => b['sort'] - a['sort']))
      return tmpNode
    },
    isNodeAlive (item) {
      return this.innerActiveNode?.id === item.id
    }
  },
  provide () {
    return {
      // 事件总线，统一触发node事件
      eventBus,
      // 树节点，用于一些统筹调度
      tree: this
    }
  },
  props: {
    canDrag: {
      type: Boolean,
      required: false,
      default: true
    },
    aliveId: {
      type: Number,
      required: false,
      default: 0
    },
    treeData: {
      type: Object,
      required: true,
    },
    // 默认选中第一个节点
    defaultActiveFirst: {
      type: Boolean,
      default: true
    },
    defaultExpendAll: {
      type: Boolean,
      required: false,
      default: false
    },
    sortCheck: {
      type: Function,
      required: false,
      default: null
    }
  }
}
</script>

<style scoped></style>
