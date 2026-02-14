import axios from "axios";

export async function braveSearch(query) {
  try {
    const res = await axios.get(
      "https://api.search.brave.com/res/v1/web/search",
      {
        params: {
          q: query,
          count: 5
        },
        headers: {
          "Accept": "application/json",
          "X-Subscription-Token": process.env.BRAVE_API_KEY
        }
      }
    );

    return res.data.web?.results
      ?.map(item => `${item.title}: ${item.description}`)
      .join("\n") || "No results found.";
  } catch (err) {
    console.error("Brave Search error:", err);
    return "Search failed or returned no results.";
  }
}
