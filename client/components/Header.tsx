import React from "react";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import Link from "next/link";

const Header = () => {
  const { data, loading } = useMeQuery({ fetchPolicy: "network-only" });
  const [logout, { client }] = useLogoutMutation();
  if (loading) {
    return <div>loading...</div>;
  }
  return (
    <header>
      {data && data.me ? (
        <div>
          <div>you {data.me.email}</div>
          <button
            onClick={async () => {
              await logout();
              localStorage.removeItem("token");
              await client.resetStore();
            }}
          >
            logout
          </button>
        </div>
      ) : (
        <div>
          <Link style={{ marginLeft: "10px" }} href={"/"}>
            home
          </Link>
          <Link style={{ marginLeft: "10px" }} href={"/register"}>
            register
          </Link>
          <Link style={{ marginLeft: "10px" }} href={"/login"}>
            login
          </Link>
          <Link style={{ marginLeft: "10px" }} href={"/bye"}>
            bye
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;
