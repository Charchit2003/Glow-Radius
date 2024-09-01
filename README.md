# Discovering Your Next Best Customer with Glow Radius

Ever wished there was a Google for B2B opportunities? **Glow Radius** is your answer. Our platform helps B2B teams across the globe uncover their next best customer with ease. Imagine having a search tool that delivers the best business prospects, tailored just for you.

## My Contribution: Improving B2B Prospecting

**How do you discover companies ready to expand after raising funding, effortlessly?**

I developed an OpenAI-based inference app that identifies companies that have recently raised funding and are looking to expand, all at the click of a button.

**For instance:**

- *Placer.ai* recently raised funding, signaling its readiness for growth. [Read more here](https://techcrunch.com/2024/08/05/placer-ai-boosts-valuation-to-1-5b-after-quietly-raising-another-75m/).

### The Challenge

Discovering such companies at scale is no easy feat. My solution automates this process, providing timely and valuable insights to B2B teams and helping them stay ahead in their business endeavors.

## Solving the Challenge: Step-by-Step

### Solution Breakdown

- **[Backend]** OpenAI-based Inference Logic
- **[Frontend]** Cloud App

### 1. Backend Logic

**User Inputs:**
- Type of companies
- Number of companies
- Data recency requirements

**Process:**

- **Fetch Data:**
  - Utilize the SERP API to gather initial search results based on user inputs.
  - Filter responses intelligently using the titles of the articles.

- **Iterate Through Articles:**
  - Extract links from the filtered search results.
  - Scrape each article's content using a custom API.

- **Content Processing:**
  - Use the Cheerio library to parse and beautify the scraped HTML content.
  - Segregate the content into headings, footers, and paragraphs.

- **OpenAI Integration:**
  - Provide the parsed content as a context in a well-engineered prompt to OpenAI.
  - Extract company names and funding details from OpenAI's response.

- **Data Enrichment:**
  - Identify the company domain from the extracted company names.
  - Enrich the data with additional details like social media pages, employee size, total funding, and growth metrics.

- **Data Conversion:**
  - Use Papa Parse to convert the enriched JSON data into CSV format, row by row.
  - Generate a CSV file and provide it as a downloadable response to the user.

### 2. Frontend Logic

**React:**

- **Dynamic Status Updates:**
  - Provide real-time feedback to users by selecting specific DOM elements and rendering updates dynamically.

- **API Integration:**
  - Utilize async/await with timeout functions to manage API calls within various components.

- **Real-time Form Inputs:**
  - Detect changes in text boxes and save form inputs in real-time.
  - Use these inputs as parameters in other workflows for a seamless user experience.

**Cloud:**

- **Google Cloud Platform (GCP) Deployment:**
  - **Continuous Integration/Continuous Deployment (CI/CD):**
    - Implement a CI/CD pipeline that automatically detects code changes pushed to GitHub.
    - GCP triggers the installation of new dependencies and runs error checks to ensure smooth deployment.

  - **Scalability and Reliability:**
    - Utilize GCP's scalable infrastructure to handle varying loads, ensuring the app remains responsive and available.

  - **Server Management:**
    - Leverage GCP's managed services to maintain and monitor server health, reducing the need for manual intervention.

  - **Security:**
    - Employ GCP's robust security features to protect data and ensure compliance with industry standards.

## Scaled Output from the Feature

[Output Example](https://github.com/Charchit2003/Glow-Radius/blob/main/Output.csv)

## Live Demo Video for the Product

[Watch the Video](https://www.loom.com/share/4f33671094264a96abaf401a5f7a492d?sid=eda37372-cfd7-49a6-a55e-11f4719c3cf8)

## Code Developed for the Feature

**Frontend Code:**

[View the Code](#)

---

**THANK YOU!!!**
