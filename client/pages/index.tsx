import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { gql } from "apollo-boost";
import { useQuery } from "@apollo/client";
import { useUsersQuery } from "../generated/graphql";
import Link from "next/link";
import Header from "../components/Header";

const Home: NextPage = () => {
  const { data } = useUsersQuery({ fetchPolicy: "network-only" });
  if (!data) {
    return <div>loading...</div>;
  }
  return (
    <div className={styles.container}>
      <Header />
      <div>users:</div>
      <ul>
        {data.users.map((u) => (
          <li key={u.id}>{u.email}</li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
