import { ApolloProvider } from "@apollo/client";
import { useApollo } from "../lib/createWithApollo";

export default function App({ Component, pageProps }) {
  const apolloClient = useApollo(pageProps);

  return (
    <ApolloProvider client={apolloClient}>
      <Component {...pageProps} />
    </ApolloProvider>
  );
}
