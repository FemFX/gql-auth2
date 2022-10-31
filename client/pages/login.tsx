import Link from "next/link";
import React, { useState } from "react";
import { MeDocument, MeQuery, useLoginMutation } from "../generated/graphql";
import { useRouter } from "next/router";
import Header from "../components/Header";

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [login] = useLoginMutation();
  const { push } = useRouter();
  return (
    <div>
      <Header />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await login({
            variables: {
              email,
              password,
            },
            update: (store, { data }) => {
              if (!data) {
                return null;
              }
              store.writeQuery<MeQuery>({
                query: MeDocument,
                data: { me: data.login.user },
              });
            },
          });
          console.log(res.data?.login.accessToken);
          res.data?.login.accessToken &&
            localStorage.setItem("token", res.data?.login.accessToken);
          push("/");
        }}
      >
        <h1>login</h1>
        <div>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">submit</button>
      </form>
    </div>
  );
};

export default Login;
