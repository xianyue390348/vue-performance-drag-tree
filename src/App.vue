<template>
  <div class="wrap">
    <div class="container">
      <DraggableDocTreeDialog class="dialog" :requestData="request">

      </DraggableDocTreeDialog>
    </div>
  </div>
</template>

<script>

import DraggableDocTreeDialog from './components/DraggableDocTreeDialog/DraggableDocTreeDialog'
import { mockData } from '@/mockData'
import { iterateTree } from '@/utils/util'
import { faker } from '@faker-js/faker';
import _ from 'lodash'

export default {
  name: 'App',
  components: {
    DraggableDocTreeDialog
  },
  methods: {
    request: async () => {
      let count = 1

      let data = _.cloneDeep(mockData)
      for(let i=0;i<10;i++) {
        data = data.concat(_.cloneDeep(data))
      }

      iterateTree({id: 0, children: data}, (node, dep, brotherTree, parent)=>{
        faker.setLocale("zh_CN");//默认英文
        node.title = faker.name.firstName()
        node.id = count
        node.parent_id = parent?.id
        count += 1
      })
      // console.log(JSON.stringify(data))
      return data
    }
  }
}
</script>

<style lang="less">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
:deep(.dialog-wrap) {

}
.wrap {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100vh;
  background-color: #f4f8fb;
}
.container {
  width: 40vw;
  height: 80vh;
  margin: 10vh auto;
  background-color: white;
  overflow: hidden;
  border-radius: 4px;
  box-shadow: 0 3px 10px 0 rgb(151 165 174 / 22%);
}
.tree-wrap {
  width: 40vw !important;
  height: 80vh !important;
  border-radius: 4px;
  overflow: hidden;
}
::-webkit-scrollbar-track
{
  box-shadow: inset 0 0 2px rgba(0,0,0,0.1);
  background-color: #F5F5F5;
}
::-webkit-scrollbar
{
  width: 8px;
  height: 8px;
  background-color: rgba(#F5F5F5, 0.8);
}

::-webkit-scrollbar-thumb
{
  background-color: rgba(#a7a7a7, 60);
&:hover {
   background-color: rgba(#a7a7a7, 80);
 }
}
</style>
