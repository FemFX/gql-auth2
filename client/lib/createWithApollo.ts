import { useMemo } from "react";
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  from,
  ApolloLink,
  concat,
  Observable,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { concatPagination } from "@apollo/client/utilities";
import merge from "deepmerge";
import isEqual from "lodash/isEqual";
import jwtDecode from "jwt-decode";
import { TokenRefreshLink } from "apollo-link-token-refresh";

export const APOLLO_STATE_PROP_NAME = "__APOLLO_STATE__";

let apolloClient;

const cache = new InMemoryCache({});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );
  if (networkError) console.log(`[Network error]: ${networkError}`);
});
const requestLink = new ApolloLink(
  (operation, forward) =>
    new Observable((observer) => {
      let handle: any;
      Promise.resolve(operation)
        .then((operation) => {
          const accessToken = localStorage.getItem("token");
          if (accessToken) {
            operation.setContext({
              headers: {
                authorization: `bearer ${accessToken}`,
              },
            });
          }
        })
        .then(() => {
          handle = forward(operation).subscribe({
            next: observer.next.bind(observer),
            error: observer.error.bind(observer),
            complete: observer.complete.bind(observer),
          });
        })
        .catch(observer.error.bind(observer));

      return () => {
        if (handle) handle.unsubscribe();
      };
    })
);

const httpLink = new HttpLink({
  uri: "http://localhost:4000/graphql", // Server URL (must be absolute)
  credentials: "include", // Additional fetch() options like `credentials` or `headers`
});

function createApolloClient() {
  return new ApolloClient({
    ssrMode: typeof window === "undefined",
    link: ApolloLink.from([
      new TokenRefreshLink({
        accessTokenField: "accessToken",
        isTokenValidOrUndefined: () => {
          const token = localStorage.getItem("token");

          if (!token) {
            return true;
          }

          try {
            const { exp }: any = jwtDecode(token);
            if (Date.now() >= exp * 1000) {
              return false;
            } else {
              return true;
            }
          } catch {
            return false;
          }
        },
        fetchAccessToken: () => {
          return fetch("http://localhost:4000/refresh_token", {
            method: "POST",
            credentials: "include",
          });
        },
        handleFetch: (accessToken) => {
          localStorage.setItem("token", accessToken);
        },
        handleError: (err) => {
          console.warn("Your refresh token is invalid. Try to relogin");
          console.error(err);
        },
      }),
      requestLink,
      new HttpLink({
        uri: "http://localhost:4000/graphql",
        credentials: "include",
      }),
    ]),
    cache,
  });
}

export function initializeApollo(initialState = null) {
  const _apolloClient = apolloClient ?? createApolloClient();

  // If your page has Next.js data fetching methods that use Apollo Client, the initial state
  // gets hydrated here
  if (initialState) {
    // Get existing cache, loaded during client side data fetching
    const existingCache = _apolloClient.extract();

    // Merge the initialState from getStaticProps/getServerSideProps in the existing cache
    const data = merge(existingCache, initialState, {
      // combine arrays using object equality (like in sets)
      arrayMerge: (destinationArray, sourceArray) => [
        ...sourceArray,
        ...destinationArray.filter((d) =>
          sourceArray.every((s) => !isEqual(d, s))
        ),
      ],
    });

    // Restore the cache with the merged data
    _apolloClient.cache.restore(data);
  }
  // For SSG and SSR always create a new Apollo Client
  if (typeof window === "undefined") return _apolloClient;
  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient;

  return _apolloClient;
}

export function addApolloState(client, pageProps) {
  if (pageProps?.props) {
    pageProps.props[APOLLO_STATE_PROP_NAME] = client.cache.extract();
  }

  return pageProps;
}

export function useApollo(pageProps) {
  const state = pageProps[APOLLO_STATE_PROP_NAME];
  const store = useMemo(() => initializeApollo(state), [state]);
  return store;
}

// import Head from "next/head";
// import { ApolloClient } from "apollo-client";
// import { InMemoryCache, NormalizedCacheObject } from "apollo-cache-inmemory";
// import { HttpLink } from "apollo-link-http";
// import { setContext } from "apollo-link-context";
// // import fetch from "isomorphic-unfetch";
// import { TokenRefreshLink } from "apollo-link-token-refresh";
// import jwtDecode from "jwt-decode";
// import { onError } from "apollo-link-error";
// import { ApolloLink } from "apollo-link";
// import cookie from "cookie";

// const isServer = () => typeof window === "undefined";

// // /**
// //  * Creates and provides the apolloContext
// //  * to a next.js PageTree. Use it by wrapping
// //  * your PageComponent via HOC pattern.
// //  * @param {Function|Class} PageComponent
// //  * @param {Object} [config]
// //  * @param {Boolean} [config.ssr=true]
// //  */
// export function withApollo(PageComponent: any, { ssr = true } = {}) {
//   const WithApollo = ({
//     apolloClient,
//     serverAccessToken,
//     apolloState,
//     ...pageProps
//   }: any) => {
//     if (!isServer() && !localStorage.getItem("token")) {
//       localStorage.setItem("token", serverAccessToken);
//     }
//     const client = apolloClient || initApolloClient(apolloState);
//     return <PageComponent {...pageProps} apolloClient={client} />;
//   };

//   if (process.env.NODE_ENV !== "production") {
//     // Find correct display name
//     const displayName =
//       PageComponent.displayName || PageComponent.name || "Component";

//     // Warn if old way of installing apollo is used
//     if (displayName === "App") {
//       console.warn("This withApollo HOC only works with PageComponents.");
//     }

//     // Set correct display name for devtools
//     WithApollo.displayName = `withApollo(${displayName})`;
//   }

//   if (ssr || PageComponent.getInitialProps) {
//     WithApollo.getInitialProps = async (ctx: any) => {
//       const {
//         AppTree,
//         ctx: { req, res },
//       } = ctx;

//       let serverAccessToken = "";

//       if (isServer()) {
//         const cookies = cookie.parse(req.headers.cookie);
//         if (cookies.jid) {
//           const response = await fetch("http://localhost:4000/refresh_token", {
//             method: "POST",
//             credentials: "include",
//             headers: {
//               cookie: "jid=" + cookies.jid,
//             },
//           });
//           const data = await response.json();
//           serverAccessToken = data.accessToken;
//         }
//       }

//       // Run all GraphQL queries in the component tree
//       // and extract the resulting data
//       const apolloClient = (ctx.ctx.apolloClient = initApolloClient(
//         {},
//         serverAccessToken
//       ));

//       const pageProps = PageComponent.getInitialProps
//         ? await PageComponent.getInitialProps(ctx)
//         : {};

//       // Only on the server
//       if (typeof window === "undefined") {
//         // When redirecting, the response is finished.
//         // No point in continuing to render
//         if (res && res.finished) {
//           return {};
//         }

//         if (ssr) {
//           try {
//             // Run all GraphQL queries
//             const { getDataFromTree } = await import("@apollo/react-ssr");
//             await getDataFromTree(
//               <AppTree
//                 pageProps={{
//                   ...pageProps,
//                   apolloClient,
//                 }}
//                 apolloClient={apolloClient}
//               />
//             );
//           } catch (error) {
//             // Prevent Apollo Client GraphQL errors from crashing SSR.
//             // Handle them in components via the data.error prop:
//             // https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-data-error
//             console.error("Error while running `getDataFromTree`", error);
//           }
//         }

//         // getDataFromTree does not call componentWillUnmount
//         // head side effect therefore need to be cleared manually
//         Head.rewind();
//       }

//       // Extract query data from the Apollo store
//       const apolloState = apolloClient.cache.extract();

//       return {
//         ...pageProps,
//         apolloState,
//         serverAccessToken,
//       };
//     };
//   }

//   return WithApollo;
// }

// let apolloClient: ApolloClient<NormalizedCacheObject> | null = null;

// /**
//  * Always creates a new apollo client on the server
//  * Creates or reuses apollo client in the browser.
//  */
// function initApolloClient(initState: any, serverAccessToken?: string) {
//   // Make sure to create a new client for every server-side request so that data
//   // isn't shared between connections (which would be bad)
//   if (isServer()) {
//     return createApolloClient(initState, serverAccessToken);
//   }

//   // Reuse client on the client-side
//   if (!apolloClient) {
//     // setAccessToken(cookie.parse(document.cookie).test);
//     apolloClient = createApolloClient(initState);
//   }

//   return apolloClient;
// }

// /**
//  * Creates and configures the ApolloClient
//  * @param  {Object} [initialState={}]
//  * @param  {Object} config
//  */
// function createApolloClient(initialState = {}, serverAccessToken?: string) {
//   const httpLink = new HttpLink({
//     uri: "http://localhost:4000/graphql",
//     credentials: "include",
//     fetch,
//   });

//   const refreshLink = new TokenRefreshLink({
//     accessTokenField: "accessToken",
//     isTokenValidOrUndefined: () => {
//       const token = localStorage.getItem("token");

//       if (!token) {
//         return true;
//       }

//       try {
//         const { exp } = jwtDecode<any>(token);
//         if (Date.now() >= exp * 1000) {
//           return false;
//         } else {
//           return true;
//         }
//       } catch {
//         return false;
//       }
//     },
//     fetchAccessToken: () => {
//       return fetch("http://localhost:4000/refresh_token", {
//         method: "POST",
//         credentials: "include",
//       });
//     },
//     handleFetch: (accessToken) => {
//       localStorage.setItem("token", accessToken);
//     },
//     handleError: (err) => {
//       console.warn("Your refresh token is invalid. Try to relogin");
//       console.error(err);
//     },
//   });

//   const authLink = setContext((_request, { headers }) => {
//     const token = isServer()
//       ? serverAccessToken
//       : localStorage.getItem("token");
//     return {
//       headers: {
//         ...headers,
//         authorization: token ? `bearer ${token}` : "",
//       },
//     };
//   });

//   const errorLink = onError(({ graphQLErrors, networkError }) => {
//     console.log(graphQLErrors);
//     console.log(networkError);
//   });

//   return new ApolloClient({
//     ssrMode: typeof window === "undefined", // Disables forceFetch on the server (so queries are only run once)
//     link: ApolloLink.from([refreshLink, authLink, errorLink, httpLink]),
//     cache: new InMemoryCache().restore(initialState),
//   });
// }
