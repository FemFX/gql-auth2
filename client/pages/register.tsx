import React, { useState } from "react";
import Link from "next/link";
import { useRegisterMutation } from "../generated/graphql";
import Router, { useRouter } from "next/router";
import Header from "../components/Header";

const Register: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [register] = useRegisterMutation();
  const { push } = useRouter();
  return (
    <div>
      <Header />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await register({
            variables: {
              email,
              password,
            },
          });
          console.log(res);
          push("/");
        }}
      >
        <h1>register</h1>
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

export default Register;
