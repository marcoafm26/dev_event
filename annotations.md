# Next.js

- Routing based on file structure.

- The technical name of this feature is File-system Based Routing.

## Types of routes

- Common route -> `app/page/page.tsx`
  - Is a common route that matches the URL `/page`.

- Dynamic route -> `app/page/[id]/page.tsx`
  - Is a dynamic route that matches the URL `/page/[id]` and we can read the value of the parameter `id` from the URL using the params.

- Routes group -> `app/page/(group)/page.tsx`
  - Is a routes group that matches the URL `/page/(group)`.

- Nested routes -> `app/page/anotherPage/otherPage/page.tsx`


## Error handling

- To use boundaries error handling you can use the `error` component, but he must be a client component.
  - Unlikely the `layout` component, only the closest `error` component will be used.

## Caching

- Next.js provides a built-in caching mechanism that can be used to cache data and components.
  - The `cacheComponents` option can be used to cache components.
    - When set to `true`, Next.js will cache components.
    - When set to `false`, Next.js will not cache components.

- This option allows us to use the new feature from Next.js 16 and also allow to use the marker 'use cache'.
  - Use 'cacheLife' on the component to set the cache life time.
  - Use 'cacheTag' on the component to set the cache tag.
  - Use 'revalidate' to force the component to be revalidated.
  - Use 'revalidateTag' to force the tag to be revalidated.

## Metadata

- Next allow us to define metadata for our pages.
  - Use 'title' to set the title of the page.
  - Use 'description' to set the description of the page.

- You can also add dynamic metadata using the function `generateMetadata` in the page.

- You can also add files inside the `app` folder to define metadata for your pages. Like `favicon.ico` or `robots.txt`. Files has higher priority than the metadata defined in the page and will override it.
