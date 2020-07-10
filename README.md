# Lazy Space

[![Build Status](https://travis-ci.org/dvallin/lazy-space.svg?branch=master)](https://travis-ci.org/dvallin/lazy-space)
[![codecov](https://codecov.io/gh/dvallin/lazy-space/branch/master/graph/badge.svg)](https://codecov.io/gh/dvallin/lazy-space)

Monads and Monad Transformers for a more functional Typescript

- Async (wraps Promises)
- Either, Try, Option (for when you are not sure what you have)
- Identity (the simplest monad)
- Lazy (just a monadic wrapper of a parameterless function)
- Reader (a very simple monadic wrapper of a function that reads some state)
- List (a lazy list)
- Tree (a monadic tree)
- FullTree (a applicative tree that also keeps values at inner nodes)
- and some graphs
