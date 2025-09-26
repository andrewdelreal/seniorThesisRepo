# Senior Thesis Repo: [PLACE YOUR PROJECT NAME HERE]
This repository is provided to help you build your senior thesis project. You will edit it to store your specification documents, code, and weekly checkins.

First, fork this repo (this makes a copy of it associated with your account) and then clone it to your machine (this makes a copy of your fork on your personal machine). You can then use an editor and a GitHub client to manage the repository.

### Markdown
This file is called README.md. It is a [Markdown file](https://en.wikipedia.org/wiki/Markdown). Markdown is a simple way to format documents. When a Markdown-ready viewer displays the contents of a file, it formats it to look like HTML. However, Markdown is significantly easier to write than HTML. VSCode supports displaying Markdown in a preview window. GitHub uses Markdown extensively including in every repo's description file, ```README.md```.

All Markdown files end with the extension ```.md```. There is a Markdown tutorial [here](https://www.markdowntutorial.com/) and a Markdown cheatsheet [here](https://www.markdownguide.org/cheat-sheet/).

#### Images
If you would like to add images to a Markdown file, place them in the ```docs/images/``` directory in this repo and reference them using markdown like this:

```
![alt text](relative/path/to/image)
```

Here is how to add the Carthage logo to a Markdown file (you can see the image in the repo right now):

```
![Carthage Firebird Logo](docs/images/firebirdLogo.jpg)
```
![Carthage Firebird Logo](docs/images/firebirdLogo.jpg)

This ensures that images are correctly linked and displayed when viewing the documentation on GitHub or any Markdown-supported platform.

## Code
The ```code``` directory is used to store your code. You can put it all in one directory or you can create subdirectories.

I have added a ```main.cpp``` file to get you started. Feel free to remove it.

If you have any questions feel free to ask me! I'll answer professor questions, customer questions, and give advice if asked.

# Project Specification

## Software Requirements Specification for the [INSERT PROJECT NAME]

## Introduction

### Purpose
The purpose of this document is to outline the functional and non-functional requirements of [INSERT PROJECT NAME]. The system is designed to provide a personal finance stock evaluator that is more geared torward individual rather than business use. 

The key goals of the new system are:
- To provide a real-time stock explorering application with the most recent information possible

- To provide an evaluation of a financial portfolio using machine learning along with standard portfolio data visuals.

- To provide predictive information on stocks and portfolios using machine learning.

- To provide customized notifications of certain stock or portfolio updates.

### Scope
This system is intended to help anyone interested in investing in the stock market, no matter the scale of the investments, by providing prediction measures to boost the confidence in investments. The system will handle:
- Secure user login through google login services (To avoid handling of login services).
- Stock searching and evaluating.
- Portfolio visualizer
- Investment risk analyzer
- Stock Predictions
- Other market insights

#### Things that would be nice to have:
- Export portfolio/statements
- import statements to upload investments and profiles.

### Definitions, Acronyms, and Abbreviations
- **Ticker Symbol**: Unique series of letter designated to a publicly traded stock (e.g., Microsoft Corporation (MSFT)).
- **Index**: A benchmasrk that represents a group of stocks (e.g., S&P 500, NASDAQ).
- **Market Capitalization** (Market Cap): The total value of a company’s outstanding shares (Price × Shares Outstanding).
- **Dividend**: A portion of a company’s earnings distributed to shareholders.
- **Dividend Yield**: A financial ratio showing dividend income relative to the stock price.
- **Earnings Per Share** (EPS): A company’s profit divided by the number of outstanding shares.
- **P/E Ratio** (Price-to-Earnings Ratio): A valuation measure comparing share price to earnings per share.
- **Volatility**: A measure of how much a stock’s price fluctuates over time.
- **Beta**: A measure of how much a stock's price fluctuates over time.
- **Portfolio**: A collection of stocks or finaincial assets owned by an individual.
- **Diversification**: The practice of spreading investments across assets to reduce risk.
- **Benchmark**: A standard used to compare portfolio performance.

## Overview
The [INSERT PROJECT NAME] is an application-based platform designed to assist in the management of investment portfolios. It serves as tool to help predict the market and provide confidence on investments. [INSERT PROJECT NAME] also provides standard portfolio viewing such as history, trends, visualizations,  etc.

### System Features:
1. **Secure Google Login**: Ensures each user has a secure login and access to their private portfolio data.
2. **Stock Search**: Allows users to look up different stocks by ticker symbol or name of company. The search when selected will pull recent stock data along with a menu to view stock options, such as evaluations and predictions.
3. **Stock Predicter**: When viewing a stock, a custom ML model will be used to predict the direction of a certain stock.
4. **Portfolio Viewer**: Provides user with a visually pleasing portfolio data, such as value, holdings, trend, etc.
5. **Send Notifications About Stock and Portfolio Updates**: 
Allow for custom notifications to decide when to be notified of a certain stock event (e.g., share price drop/increase).

The system is designed with personal use in mind, meant to enhance personal envestments in a easy and helpfulway by providing built in stock predicters through the use of machine learning.

The following sections detail the specific use cases that the system will support, describing how users will interact with the system during typical use.

## Use Cases

### Use Case 1.1: Secure Login
- **Actors**: User
- **Overview**: User logs in with their Google email to provide a secure login system.

**Typical Course of Events**:
1. System prompts user to login with a Google account.
2. User selects their google account and provides credentials if required.
3. System verifies credentials with Google.
4. System redirects user to their personal homepage.

**Alternative Courses**:
- **Step 3 - invalid credentials**: User and/or password are not correct.
  
  - 3a Displays error.
  - 3b Go back to step 1.

### Use Case 1.2: Find a Stock/Fund
- **Actors**: User
- **Overview**: User searches for a stock and the recent stock data is retrieved for the user.

**Typical Course of Events**:
1. Run Use Case 1.1, *Secure Login*.
2. From the home page a "Stocks" tab is selected and redirects user to stocks page.
3. User searches for a stock by name/ticker symbol by clicking the search bar.
4. Displays general stock info and viewing options.

**Alternative Courses**:
- **From step 2 (Browse instead of search)**: User can scroll through the top ticker sybols or sort the ticker symbols by different metrics instead of directly searching.
  - 2a. User scrolls through top tickers or sorts by metrics
  - 2b. User selects a ticker symbol.
  - 2c. System displays stock details.
  - 2d. Return to Step 4.

### Use Case 1.3: Evaluate Stock
- **Actors**: User
- **Overview**: User evaluates a stock option using a model to predict and evaluate the stock option.

**Typical Course of Events**:
1. Run Use Case 1.2, *Find a Stock/Fund*.
2. From the stock details page, user clicks on evaluations and chooses an option (e.g., predict or analyze risk)
3. Display stock evaluations request.

**Alternative Courses**:
- **From step 2**: User selects a different evaluation method (e.g., user wants to evaluate the Beta instead of the risk).
  - 2a. User selects a different evaluation method.
  - 2b. Return to step 3.

### Use Case 1.4: View Portfolio
- **Actors**: User
- **Overview**: User gets a visual and data about their stock portfolio.

**Typical Course of Events**:
1. Run Use Case 1.1, *Secure Login*.
2. Display home page, which will hold their personal investment visuals.

### Use Case 1.5: Analyze Portfolio
- **Actors**: User
- **Overview**: calculate and display analytics of the user's portfolio

**Typical Course of Events**:
1. Run Use Case 1.4, *View Portfolio*
2. From the portfolio page, user clicks on evaluations and chooses an option (e.g., change timeframe, display holdings)
3. Display portfolio options

**Alternative Courses**:
- **From step 2**: User selects a different evaluation method (e.g., user wants to evaluate the risk of their portfolio instead of viewing their portfolio).
  - 2a. USer chooses a different analysis option.
  - 2b. Return to Step 3.

### Use Case 1.6: Modify Notifications
- **Actors**: User
- **Overview**: Update notification settings.

**Typical Course of Events**:
1. Run Use Case 1.1, *Secure Login*.
2. From the home page, user selects the notifications tab.
3. The user selects which notification options they want.
4. System saves notification settings.

**Alternative Courses**:
- **From Step 1**: User adds stock to notification pool.
  - 1a. Run Use Case 1.2, *Find a Stock/Fund*.
  - 1b. While viewing the details of any stock, there user can click on an option to add stock to notifications.
  - 1c. System updates notification preferences accordingly.
