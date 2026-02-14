import { ApolloClient, createHttpLink, InMemoryCache, makeVar } from "@apollo/client";

// The "Heartbeat" state - toggles to trigger animation
export const heartbeatVar = makeVar(false);

const cache = new InMemoryCache({
  typePolicies: {
    Server: {
      fields: {
        permissions: {
          merge(existing, incoming, { mergeObjects }) {
            // Trigger the Pulse
            heartbeatVar(!heartbeatVar()); 
            return mergeObjects(existing, incoming);
          },
        },
      },
    },
  },
});

const client = new ApolloClient({
  link: createHttpLink({ uri: "https://your-engine-2026.render.com/graphql" }),
  cache: cache,
});

export default client;
