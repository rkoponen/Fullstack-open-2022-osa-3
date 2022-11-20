require('dotenv').config()
const express = require('express')
const app = express()

const cors = require('cors')

const morgan = require('morgan')
morgan.token('content', (req) => {
  return JSON.stringify(req.body)
})

let persons = [
  {
    name: 'anna',
    number: '123',
    id: 3
  },
  {
    name: 'mikko',
    number: '050-501231',
    id: 3
  }

]

const Person = require('./models/person')

app.use(morgan((tokens, req, res) => {
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms',
    tokens.content(req, res)
  ].join(' ')

}))

app.use(express.json())
app.use(cors())
app.use(express.static('build'))

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id).then(person => {
    if (person) {
      response.json(person)
    } else {
      response.status(404).end()
    }
  })
    .catch(error => next(error))
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then(notes => {
    response.json(notes)
  })
})

app.get('/info', (request, response) => {
  Person.find({}).then(persons => {
    if (persons.length === 1) {
      response.send(`<p>Phonebook has info for 1 person}</p>
            <p>${new Date()}</p>
        `)
    } else {
      response.send(`<p>Phonebook has info for ${persons.length} people</p
            <p>${new Date()}</p>`)
    }
  })


})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(
      response.status(204).end()
    )
    .catch(error => next(error))
})

const generateID = () => {
  let id = Math.floor(Math.random() * 10000)
  if (persons.map(p => p.id).includes(id)) {
    id = generateID()
  }
  return id
}

app.post('/api/persons', (request, response, next) => {
  morgan
  const body = request.body

  const person = new Person({
    name: body.name,
    number: body.number,
    id: generateID(),
  })
  person.save().then(savedPerson => {
    response.json(savedPerson)
  })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body
  console.log(body)
  const person = {
    name: body.name,
    number: body.number,
  }

  Person.findByIdAndUpdate(request.params.id, person, { new: true })
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }
  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})