const express = require('express')
const app = express()
const AVLTree = require('avl')
const port = 3000
const wordsQueue = []
const inMemoryStoredWords = {}
const frequenciesTree = new AVLTree()

const addNewWordToNode = ({ nodeKey, word }) => {
  const treeNode = frequenciesTree.find(nodeKey)
  const newWordsArray = treeNode.data.push(word)
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
  const newWordOccurences = inMemoryStoredWords[word] + 1
  inMemoryStoredWords[word] = inMemoryStoredWords
  // remove word from frequency store
  removeWordFromNode({ nodeKey: newWordOccurences - 1, word })

  // add new frequency with the word
  if (!frequenciesTree.contains(newWordOccurences)) {
    frequenciesTree.insert(newWordOccurences, [word])
  }
  // update the frequency with the new word
  else {
    addNewWordToNode({ nodeKey: newWordOccurences, word })
  }
}
const processWords = () => {
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
  console.log('inMemoryStoredWords', inMemoryStoredWords)
}

setInterval(processWords, 1000)

app.use(express.json())
app.get('/statistics', async (req, res) => {
  const incomingWords = req.body?.words.split(',')
  res.send('Hello World!')
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
