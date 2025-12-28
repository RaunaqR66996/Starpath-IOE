import { gql } from 'graphql-tag'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { GraphQLScalarType, Kind } from 'graphql'

// In-memory data store (replacing Redis)
const dataStore = {
  analytics: new Map(),
  metrics: new Map(),
  cache: new Map()
}

// Custom scalar for Date
const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value: any) {
    return value instanceof Date ? value.toISOString() : value
  },
  parseValue(value: any) {
    return new Date(value)
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value)
    }
    return null
  }
})

const typeDefs = gql`
  scalar Date

  type AnalyticsReport {
    id: ID!
    type: String!
    data: JSON!
    createdAt: Date!
    updatedAt: Date!
  }

  type Metric {
    id: ID!
    name: String!
    value: Float!
    unit: String
    timestamp: Date!
    tags: [String!]
  }

  type Query {
    analyticsReports(type: String): [AnalyticsReport!]!
    analyticsReport(id: ID!): AnalyticsReport
    metrics(name: String, startDate: Date, endDate: Date): [Metric!]!
    systemHealth: SystemHealth!
  }

  type Mutation {
    createAnalyticsReport(input: AnalyticsReportInput!): AnalyticsReport!
    updateAnalyticsReport(id: ID!, input: AnalyticsReportInput!): AnalyticsReport!
    deleteAnalyticsReport(id: ID!): Boolean!
    createMetric(input: MetricInput!): Metric!
  }

  input AnalyticsReportInput {
    type: String!
    data: JSON!
  }

  input MetricInput {
    name: String!
    value: Float!
    unit: String
    tags: [String!]
  }

  type SystemHealth {
    status: String!
    uptime: Float!
    memoryUsage: Float!
    cpuUsage: Float!
    activeConnections: Int!
  }

  scalar JSON
`

const resolvers = {
  Date: DateScalar,
  
  Query: {
    analyticsReports: (parent: any, { type }: { type?: string }) => {
      const reports = Array.from(dataStore.analytics.values())
      if (type) {
        return reports.filter((report: any) => report.type === type)
      }
      return reports
    },

    analyticsReport: (parent: any, { id }: { id: string }) => {
      return dataStore.analytics.get(id)
    },

    metrics: (parent: any, { name, startDate, endDate }: { name?: string, startDate?: Date, endDate?: Date }) => {
      let metrics = Array.from(dataStore.metrics.values())
      
      if (name) {
        metrics = metrics.filter((metric: any) => metric.name === name)
      }
      
      if (startDate) {
        metrics = metrics.filter((metric: any) => metric.timestamp >= startDate)
      }
      
      if (endDate) {
        metrics = metrics.filter((metric: any) => metric.timestamp <= endDate)
      }
      
      return metrics.sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime())
    },

    systemHealth: () => {
      const startTime = Date.now()
      const uptime = (Date.now() - startTime) / 1000
      
      return {
        status: 'healthy',
        uptime,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        cpuUsage: 0, // Would need to implement CPU monitoring
        activeConnections: 0 // Would need to implement connection tracking
      }
    }
  },

  Mutation: {
    createAnalyticsReport: (parent: any, { input }: { input: any }) => {
      const id = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const report = {
        id,
        ...input,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      dataStore.analytics.set(id, report)
      return report
    },

    updateAnalyticsReport: (parent: any, { id, input }: { id: string, input: any }) => {
      const existing = dataStore.analytics.get(id)
      if (!existing) {
        throw new Error(`Analytics report with id ${id} not found`)
      }
      
      const updated = {
        ...existing,
        ...input,
        updatedAt: new Date()
      }
      
      dataStore.analytics.set(id, updated)
      return updated
    },

    deleteAnalyticsReport: (parent: any, { id }: { id: string }) => {
      return dataStore.analytics.delete(id)
    },

    createMetric: (parent: any, { input }: { input: any }) => {
      const id = `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const metric = {
        id,
        ...input,
        timestamp: new Date()
      }
      
      dataStore.metrics.set(id, metric)
      return metric
    }
  }
}

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers
})

// Helper functions for data management
export const analyticsService = {
  createReport: (type: string, data: any) => {
    const id = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const report = {
      id,
      type,
      data,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    dataStore.analytics.set(id, report)
    return report
  },

  getReports: (type?: string) => {
    const reports = Array.from(dataStore.analytics.values())
    if (type) {
      return reports.filter((report: any) => report.type === type)
    }
    return reports
  },

  createMetric: (name: string, value: number, unit?: string, tags?: string[]) => {
    const id = `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const metric = {
      id,
      name,
      value,
      unit,
      tags: tags || [],
      timestamp: new Date()
    }
    
    dataStore.metrics.set(id, metric)
    return metric
  },

  getMetrics: (name?: string) => {
    let metrics = Array.from(dataStore.metrics.values())
    if (name) {
      metrics = metrics.filter((metric: any) => metric.name === name)
    }
    return metrics.sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime())
  }
} 