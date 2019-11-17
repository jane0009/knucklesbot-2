//https://gist.github.com/kevincennis/5440878

// basic usage: new Markov(lotsOfText).generate()

// markov chain constructor
//
// @string input {example text}
// @integer len {optional # of words to output}
// @integer stateSize {optional chain order}
function Markov( input, len, stateSize ){
  this.cache = Object.create(null)
  this.words = input.split(/\s/)
  this.startwords = [this.words[0]]
  this.stateSize = stateSize || 2
  this.outputSize = len || 100
  this.analyzed = false
}

// return a random element from an array
Markov.prototype.choose = function( arr ){
  return arr[~~( Math.random() * arr.length )]
}

// get the next set of words as a string
Markov.prototype.getNextSet = function( i ){
  return this.words.slice(i, i + this.stateSize).join(' ')
}

// create a markov lookup
Markov.prototype.analyze = function( input ){
  var len = this.words.length, next
  this.words.forEach(function( word, i ){
    next = this.getNextSet(++i)
    ;(this.cache[word] = this.cache[word] || []).push(next)
    ;/[A-Z]/.test(word[0]) && this.startwords.push(word)
  }.bind(this))
  return this.analyzed = true && this
}

// generate new text from a markov lookup
Markov.prototype.generate = function(){
  var seed, arr, choice, curr, i = 1
  !this.analyzed && this.analyze()
  arr = [seed = this.choose(this.startwords)]
  for ( ; i < this.outputSize; i += this.stateSize ){
    arr.push(choice = this.choose(curr || this.cache[seed]))
    curr = this.cache[choice.split(' ').pop()]
  }
  return arr.join(' ') + '.'
}

module.exports = Markov