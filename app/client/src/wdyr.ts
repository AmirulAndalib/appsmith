import React from "react";
import whyDidYouRender from "@welldone-software/why-did-you-render";

// <reference types="@welldone-software/why-did-you-render" />
// ^ https://github.com/welldone-software/why-did-you-render/issues/161

// if (process.env.NODE_ENV === "development") {
//   const whyDidYouRender = require("@welldone-software/why-did-you-render");
//   whyDidYouRender(React, {
//     trackAllPureComponents: false,
//     trackExtraHooks: [[require("react-redux/lib"), "useSelector"]],
//   });
// }

if (process.env.NODE_ENV === "development") {
  whyDidYouRender(React, {
    trackAllPureComponents: false,
    trackHooks: false,
  });
}
export default "";
