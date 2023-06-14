const express = require('express')
const app = express()
const AVLTree = require('avl')
const port = 3000
const wordsQueue = []
const inMemoryStoredWords = {}
const frequenciesTree = new AVLTree()

const addNewWordToNode = ({ nodeKey, word }) => {
  const treeNode = frequenciesTree.find(nodeKey)
  const newWordsArray = treeNode.data
  newWordsArray.push(word)
  frequenciesTree.remove(nodeKey)
  frequenciesTree.insert(nodeKey, newWordsArray)
}

const removeWordFromNode = ({ nodeKey, word }) => {
  const treeNode = frequenciesTree.find(nodeKey)
  // if only the word in last frequency then remove the node
  if (treeNode.data.length === 1 && treeNode.data[0] === word) {
    frequenciesTree.remove(nodeKey)
  }
  // last frequency has other words too
  else {
    const newWordsArray = treeNode.data.filter((iterWord) => iterWord !== word)
    frequenciesTree.remove(nodeKey)
    frequenciesTree.insert(nodeKey, newWordsArray)
  }
}

const processWordWhichIsNotInHistogram = (word) => {
  inMemoryStoredWords[word] = 1
  if (!frequenciesTree.contains(1)) {
    frequenciesTree.insert(1, [word])
  } else {
    addNewWordToNode({ nodeKey: 1, word })
  }
}

const processWordWhichIsInHistogram = (word) => {
  const newWordOccurrences = Number(inMemoryStoredWords[word]) + 1
  inMemoryStoredWords[word] = newWordOccurrences
  // remove word from frequency store
  removeWordFromNode({ nodeKey: newWordOccurrences - 1, word })

  // add new frequency with the word
  if (!frequenciesTree.contains(newWordOccurrences)) {
    frequenciesTree.insert(newWordOccurrences, [word])
  }
  // update the frequency with the new word
  else {
    addNewWordToNode({ nodeKey: newWordOccurrences, word })
  }
}
export const processWords = () => {
  if (wordsQueue.length === 0) {
    return
  }
  const wordsString = wordsQueue.shift()
  if (!wordsString || typeof wordsString !== 'string') {
    return
  }
  const splitWords = wordsString.split(',')
  splitWords.forEach((word) => {
    // word isn't in the histogram
    if (!inMemoryStoredWords[word]) {
      processWordWhichIsNotInHistogram(word)
    }
    // word is already in the histogram
    else {
      processWordWhichIsInHistogram(word)
    }
  })
}

const getTopOccurrences = (topNumOfElements) => {
  const topOccurrences = {}
  let currentNode = frequenciesTree.maxNode()
  let elementsCounter = 0
  while (elementsCounter < topNumOfElements && currentNode) {
    let nodeWordsCounter = 0
    const currentNodeWords = [...currentNode.data]
    while (
      elementsCounter < topNumOfElements &&
      nodeWordsCounter < currentNodeWords.length
    ) {
      const wordToInsert = currentNodeWords.pop()
      topOccurrences[wordToInsert] = Number(inMemoryStoredWords[wordToInsert])
      elementsCounter++
      nodeWordsCounter++
    }
    currentNode = frequenciesTree.prev(currentNode)
  }

  return topOccurrences
}
export const getStats = () => {
  const statsOutput = {}
  const frequencies = frequenciesTree.keys()
  statsOutput.least = frequencies[0]
  statsOutput.median = frequencies[Math.floor(frequencies.length / 2)]
  const topOccurrences = getTopOccurrences(5)
  statsOutput.top5 = topOccurrences
  return statsOutput
}

setInterval(processWords, 1000)

app.use(express.json())
app.get('/statistics', async (req, res) => {
  const statistics = getStats()
  res.status(200).send(statistics)
})
app.post('/words', (req, res) => {
  const wordsInput = req.body?.words
  if (typeof wordsInput !== 'string') {
    res.status(422).send('Wrong input type')
    return
  }
  wordsQueue.push(wordsInput)
  res.status(200).send('Words were processed successfully!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
