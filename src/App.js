import React, { useState, useEffect, useCallback } from 'react'
import { Form, Button } from 'react-bootstrap'
import axios from 'axios'
import { FaGithub } from "react-icons/fa"
import { LiaAtomSolid } from "react-icons/lia"
import { IoIosCloseCircleOutline } from "react-icons/io"
import { IoDocumentTextOutline } from "react-icons/io5"
import Spinner from 'react-bootstrap/Spinner'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import './App.css'

const getSchema = async () => {
    const url = `${process.env.REACT_APP_API}/v1/schema`
    const response = await axios.get(url)
    console.log(`Schema: ${JSON.stringify(response.data)}`)
    return response.data
}

const getPrediction = async (data) => {
    console.log(`Predict: ${JSON.stringify(data)}`)
    const url = `${process.env.REACT_APP_API}/v1/predict`
    const response = await axios.post(url, {events: [data]})
    console.log(`Prediction: ${JSON.stringify(response.data)}`)
    return response.data.prediction[0][0]
}

const Connecting = () => {
  return (
    <div className='viu-connecting'>
      <p>Trying to connect with the backend...</p>
      <p>
        <a target='be' href={ process.env.REACT_APP_API + '/v1/schema'}>
          { process.env.REACT_APP_API }/v1/schema
        </a>
      </p>
    </div>
  )
}

const Prediction = ({prediction, threshold}) => {
  if (prediction === null || prediction > 1 || prediction < 0)
    return null
  return (
    <div className='viu-prediction'>
      {
        prediction > threshold ? (
          <p>
            <LiaAtomSolid/>
            &nbsp;
            Higgs Boson Detected!
          </p>
        ) : (
          <p>
            <IoIosCloseCircleOutline/>
            &nbsp;
            No Boson Detected!
          </p>
        )
      }
    </div>
  )
}

const Threshold = ({threshold, onChange}) => {
  const handleChange = useCallback(value => {
    if (value >= 0 && value <= 100)
      onChange(value / 100)
  }, [onChange])

  return (
    <Container className='viu-threshold' fluid>
      <Row>
        <Col xs={12} sm={7} md={8} lg={9}>
          <Form.Range
            value={parseInt(100 * threshold)}
            onChange={e => handleChange(e.target.value)}
            min={0}
            max={100}
          />
        </Col>
        <Col xs={12} sm={5} md={4} lg={3}>
          <Form.Label>
            {parseInt(100 * threshold)}%
            &nbsp;
            Confidence
          </Form.Label>
        </Col>
      </Row>
    </Container>
  )
}

const Predict = ({loading, onClick}) => {
  if (loading)
    return (
      <div className='viu-button'>
        <Button onClick={() => {}}>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </Button>
      </div>
    )
  return (
    <div className='viu-button'>
      <Button onClick={onClick}>
        <LiaAtomSolid/>
        &nbsp;
        Predict
      </Button>
    </div>
  )
}

const Feature = ({field, value, min, max, onChange}) => {
  const SCALE = 100000000

  const handleChange = useCallback(value => {
    if (value >= min && value <= max)
      onChange(field, value)
  }, [onChange, field, min, max])

  return (
    <Form.Group className='viu-feature'>
      <Form.Label>{ field.slice(0, 20) }</Form.Label>
      <Form.Control
        type="number"
        name={field}
        value={value !== null ? parseFloat(value).toFixed(4) : ''}
        min={min}
        max={max}
        onChange={e => handleChange(e.target.value)}
      />
      <Form.Range
        value={value * SCALE}
        onChange={e => handleChange(e.target.value / SCALE)}
        min={parseInt(min * SCALE)}
        max={parseInt(max * SCALE)}
      />
    </Form.Group>
  )
}

const Features = ({schema, data, onChange}) => {
  return (
    <Container className='viu-features' fluid>
      <Row>
        {
          Object.keys(schema).map((field, index) => (
            <Col key={field} xs={3} sm={6} md={4} lg={3}>
              <Feature
                key={field}
                field={field}
                onChange={onChange}
                value={data[field]}
                min={schema[field].min}
                max={schema[field].max}
              />
            </Col>
          ))
        }
      </Row>
    </Container>
  )
}

export const Error = ({error}) => {
  if (!error)
    return null
  return (
    <div className='viu-error'>
      <p>Error: { error }</p>
    </div>
  )
}

export const Title = () => {
  return (
    <div className='viu-title'>
      <p>Higgs Boson Detector</p>
    </div>
  )
}

export const Author = () => {
  return (
    <div className='viu-author'>
      <p>Martin Alejandro Castro Alvarez</p>
    </div>
  )
}

export const GitHub = () => {
  return (
    <div className='viu-github'>
      <a target='gh' href="https://github.com/MartinCastroAlvarez/higgs-boson-machine-learning">
        <FaGithub/>
        &nbsp;
        GitHub
      </a>
    </div>
  )
}

export const Paper = () => {
  return (
    <div className='viu-paper'>
      <a target='pa' href="https://github.com/MartinCastroAlvarez/higgs-boson-machine-learning/blob/main/PaperEN.pdf">
        <IoDocumentTextOutline/>
        &nbsp;
        Paper
      </a>
    </div>
  )
}

export const Layout = ({children}) => {
  return (
    <Container className='viu-layout' fluid>
      <Row>
        <Col xs={0} sm={1} md={2} lg={3}></Col>
        <Col xs={12} sm={10} md={8} lg={6} className='viu-body'>
          { children }
        </Col>
        <Col xs={0} sm={1} md={2} lg={3}></Col>
      </Row>
    </Container>
  )
}

export const App = () => {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(false)
  const [schema, setSchema] = useState(null)
  const [error, setError] = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [threshold, setThreshold] = useState(0.5)

  const handleSubmit = useCallback(async () => {
    setLoading(true)
    setPrediction(null)
    setError(null)
    try {
      const prediction = await getPrediction(data)
      setPrediction(prediction)
    } catch (error) {
      setError('Prediction failed!')
    } finally {
      setLoading(false)
    }
  }, [data])

  const handleChange = useCallback((key, value) => {
    const newData = {...data}
    newData[key] = parseFloat(value)
    setData(newData)
  }, [data])

  useEffect(() => {
    async function fetch() {
      const newSchema = await getSchema()
      setSchema(newSchema)
      const newData = {}
      Object.keys(newSchema).forEach(field => {
        newData[field] = newSchema[field].mean.toFixed(4)
      })
      setData(newData)
    }
    fetch()
  }, [])

  if (!schema)
    return (
      <Layout>
        <Title/>
        <Author/>
        <GitHub/>
        <Connecting/>
      </Layout>
    )

  return (
    <Layout>
      <Title/>
      <Author/>
      <GitHub/>
      <Paper/>
      <Features schema={schema} data={data} onChange={handleChange}/>
      <Predict onClick={handleSubmit} loading={loading}/>
      <Threshold threshold={threshold} onChange={setThreshold}/>
      <Prediction prediction={prediction} threshold={threshold}/>
      <Error error={error}/>
    </Layout>
  )
}
