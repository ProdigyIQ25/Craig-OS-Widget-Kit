import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name:"Craig OS", short_name:"Craig OS", description:"Craig OS direct operating application", start_url:"/", display:"standalone", background_color:"#12161c", theme_color:"#12161c", icons:[{src:"/icon.svg",sizes:"any",type:"image/svg+xml",purpose:"maskable"},{src:"/apple-icon",sizes:"180x180",type:"image/png",purpose:"any"}] };
}
