import React from "react";
import Header from "../components/Header";
import { useByeQuery } from "../generated/graphql";

const Bye = () => {
  const { data, loading, error } = useByeQuery();
  if (loading) {
    return <div>loading</div>;
  }
  if (error) {
    console.log(error);
    return <div>err</div>;
  }
  if (!data) {
    return <div>no data</div>;
  }
  return (
    <div>
      <Header />
      {data.bye}
    </div>
  );
};

export default Bye;
