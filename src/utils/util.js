
export const IterateTreeOrderType = {
  // 先序遍历，当前节点 =》 子节点
  PreOrder: 0,
  // 后序遍历，子节点 =》 树节点
  PostOrder: 1
}

// 非递归版迭代树形结构
export const iterateTree = (
  treeNode,
  callback,
  dep = 9999,
  key = 'children',
  orderType = IterateTreeOrderType.PreOrder
) => {
  let tmpStack = []
  let resultStack = []

  resultStack.push({ value: treeNode, dep, brotherTree: [], parent: { id: -1 } })
  tmpStack.push(treeNode)

  // eslint-disable-next-line no-constant-condition
  while (true) {
    dep -= 1
    if (dep < 0 || !tmpStack.length) {
      break
    }
    const nextTurnStack = []
    while (tmpStack.length) {
      const tmpNode = tmpStack.pop()
      if (tmpNode[key] && tmpNode[key].length) {
        tmpNode[key].forEach(children => {
          nextTurnStack.push(children)
          resultStack.push({ value: children, dep, brotherTree: tmpNode[key], parent: tmpNode })
        })
      }
    }
    tmpStack = [...nextTurnStack]
  }
  // 后序遍历，直接reverse就好
  if (orderType === IterateTreeOrderType.PostOrder) {
    resultStack = resultStack.reverse()
  }
  resultStack.forEach(({ value, dep, brotherTree, parent }) => callback(value, dep, brotherTree, parent))
}
