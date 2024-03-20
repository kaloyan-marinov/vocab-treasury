export const DeleteExample = () => {
  console.log(
    `${new Date().toISOString()} - React is rendering <DeleteExample>`
  );

  return (
    <>
      {process.env.NODE_ENV === "development" && "<DeleteExample>"}
      <div>TBD</div>
    </>
  );
};
