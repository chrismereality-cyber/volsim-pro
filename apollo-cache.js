import { InMemoryCache } from "@apollo/client";

const cache = new InMemoryCache({
  typePolicies: {
    // Option A: Policy on the Server object's permissions field
    Server: {
      fields: {
        permissions: {
          // Setting merge to true tells Apollo to merge the sub-fields 
          // of the existing and incoming permission objects.
          merge: true, 
        },
      },
    },
    // Option B: Policy on the ServerPermissions type itself
    ServerPermissions: {
      merge: true,
    },
  },
});

export default cache;
