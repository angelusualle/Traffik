# Team 53 Project Traffik 
# Description: "Describe the package in a few paragraphs"

This code is for Team 53's Project: Traffik of OMSCS 6242. It is the code that creates a javascript single page application that visualizes fatality data across the United States and the output of two machine learning algorithms tasked with perdicting fatalities.

## Populations file by state per year
To get the populations for each state for each year, the Census.gov cites we referenced in our references provide two .xlsx files. We pulled those two files, one has years 2000-2010 and the other had 2010-2019. We merged these two using vlookup and removed the columns which were not for a given year, but were additional estimates provided by the census for partial years. This manipulation took place in excel.

# Installation: "How to install and setup your code"
## Getting Started - 

These instructions will get you a copy of the project up and running on your local machine.

1. Heama

2. Naveen

3. Angel

4. Calvin

### Prerequisites and Requirements
Python3 is required, see official website to [download and install](https://www.python.org/download/releases/3.0/).
Chrome version of at least Version 80.0.3987.122 is required, see official website to [download and install](https://www.google.com/chrome/).

1. SQLite
2. Python
3. Tableau
4. D3, including tensorflow.js
5. Excel

# Execution: "How to run a demo on your code"
## Running the code - 

To run this code, navigate command prompt to the root of this project and run the following command in the terminal:
```
python3 -m http.server
```
And navigate to the resulting [url](http://0.0.0.0:8000).

## To run the machine learning algorithms Jupyter Notebook
Navigate to `data/python_ml/` directory and type in:
```
jupyter notebook
```

## Live version
https://traffik.surge.sh/



## Authors

* **Angel Barranco** 
* **Amber Camiul**
* **Heama Chandrasekaran**
* **Calvin Jr Clayton**
* **Debbie Ann Jenkins**
* **Naveen Kunnummal Purayil**
