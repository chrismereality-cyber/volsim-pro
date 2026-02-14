const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");

// THE 2026 DEPLOYMENT SECRET: 
// Render injects a port via process.env.PORT. 
// Locally, it will default to 4000.
const PORT = process.env.PORT || 10000;

const typeDefs = `#graphql
  type ServerStatus {
    id: ID!
    name: String
    btcPrice: Float
  }
  type Query {
    getServer(id: ID!): ServerStatus
  }
`;

const resolvers = {
  Query: {
    getServer: (_, { id }) => ({
      id,
      name: "VOLSIM-PRO-ENGINE",
      btcPrice: 87602.06
    }),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

async function start() {
  const { url } = await startStandaloneServer(server, {
    listen: { port: parseInt(PORT) },
  });
  console.log(`🚀 VOLSIM ENGINE LIVE AT: ${url}`);
  console.log(`🌐 Production Port: ${PORT}`);
}

start();
