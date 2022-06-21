<template>
  <div class="dialog-wrap">
    <div :class="{ 'tree-wrap': true }">
      <div class="desc">
        <span class="desc-title">
          文档
        </span>
        <!-- 帮助展开的按钮 -->
        <div class="helper-btn">
          <a-space>
            <!--搜索按钮-->
            <search-outlined v-if="innerSearch" class="search-btn" type="search" @click="visibleSearchModal = true"/>
            <a-dropdown v-if="currentTab === defaultTabName">
              <a class="ant-dropdown-link" @click="e => e.preventDefault()">
                <fullscreen-outlined />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item>
                    <a @click="() => $refs.tree.expendLevelNode()">展开全部</a>
                  </a-menu-item>
                  <a-menu-item>
                    <a @click="() => $refs.tree.expendLevelNode(1)">展开一级目录</a>
                  </a-menu-item>
                  <a-menu-item>
                    <a @click="() => $refs.tree.expendLevelNode(2)">展开二级目录</a>
                  </a-menu-item>
                  <a-menu-item>
                    <a @click="() => $refs.tree.clearExpend()">收起所有</a>
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-space>
        </div>
      </div>
      <draggable-doc-tree
        class="tree"
        ref="tree"
        :tree-data="treeData"
        style="height: 100%"
        @click="onClickItem"
        @requestSort="requestSort"
        v-bind="$attrs"
      />
    </div>
  </div>
</template>

<script>
import DraggableDocTree from '@/components/DraggableDocTree/DragableDocTree'
import AMenu from 'ant-design-vue/lib/menu'
import ADropdown from 'ant-design-vue/lib/dropdown'
import ASpace from 'ant-design-vue/lib/space'
import { SearchOutlined, FullscreenOutlined } from '@ant-design/icons-vue';
import { iterateTree } from '@/utils/util'

const defaultTabName = '目录'

export default {
  name: 'DraggableDocTreeDialog',
  components: {  SearchOutlined, DraggableDocTree, FullscreenOutlined, AMenu, AMenuItem: AMenu.Item, ADropdown, ASpace },
  computed: {
    innerTab () {
      return this.tab
        .concat({
          name: defaultTabName
        })
        .reverse()
    }
  },
  methods: {
    requestSort (data) {
      this.$emit('requestSort', data)
    },
    switchTab (tab) {
      this.currentTab = tab.name
    },
    onClickItem (node) {
      this.$refs.tree.activeNode(node)
      this.$emit('onClickItem', node)
    },
    getData () {
      return this.requestData().then(res => {
        // 生成根节点
        res.sort((a, b) => b['sort'] - a['sort'])
        this.treeData = { id: -1, children: res }
        iterateTree(this.treeData, item => item.children.sort((a, b) => b['sort'] - a['sort']))
        this.loading = false
        this.$emit('requestDataFinish')
      })
    },
    emptyActiveNode () {
      this.$refs.tree.emptyActiveNode()
    }
  },
  props: {
    moreMenus: {
      type: Array,
      default: () => []
    },
    tab: {
      type: Array,
      default: () => []
    },
    requestData: {
      type: Function,
      required: true
    },
    innerSearch: {
      type: Object,
      required: false,
      default: () => null
    }
  },
  data () {
    return {
      currentTab: defaultTabName,
      defaultTabName,
      loading: true,
      treeData: {},
      currentNodeID: 0,
      visibleSearchModal: false
    }
  },
  mounted () {
    this.getData()
  }
}
</script>

<style scoped lang="less">
.dialog-wrap {
  width: 240px;
}

.tree-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: white;

  flex-shrink: 0;
  text-align: left;
  width: 240px;

  border-left: 1px solid #e8e8e8;
  border-right: 1px solid #e8e8e8;

  .desc {
    flex-grow: 0;
    flex-shrink: 0;
    font-size: 18px;
    border-bottom: 1px solid #e8e8e8;

    padding-left: 10px;
    padding-bottom: 6px;
    padding-top: 6px;

    .helper-btn {
      display: inline-block;
      float: right;
      filter: grayscale(100%);
      cursor: pointer;
      margin-right: 10px;
    }

    .helper-btn::after {
      clear: both;
    }
  }

  .tree {
    flex-shrink: 1;
    flex-grow: 1;
    overflow: hidden;
  }
}
.desc-title {
  font-size: 14px;
}
</style>
