import { useParams } from "react-router-dom";

export const ConfirmEmailAddress = () => {
  console.log(
    `${new Date().toISOString()} - React is rendering <ConfirmEmailAddress>`
  );

  const params: { token_for_confirming_email_address: string } = useParams();
  console.log(
    `${new Date().toISOString()} - inspecting the \`params\` passed in to <ConfirmEmailAddress>`
  );

  return (
    <>
      {process.env.NODE_ENV === "development" && "<ConfirmEmailAddress>"}
      <div className="mx-auto col-md-6">
        token_for_confirming_email_address:{" "}
        {params.token_for_confirming_email_address}
      </div>
    </>
  );
};
