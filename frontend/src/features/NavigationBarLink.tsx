import { Link } from "react-router-dom";

interface PropsForNavigationBarLink {
  destination: string;
  isActive: boolean;
  text: string;
}

export const NavigationBarLink = (props: PropsForNavigationBarLink) => {
  console.log(
    `${new Date().toISOString()} - React is rendering <NavigationBarLink>`
  );

  const className = `btn btn-dark ${props.isActive && "active"}`;

  return (
    <Link to={props.destination} className={className}>
      {props.text}
    </Link>
  );
};
