[![DOI](https://zenodo.org/badge/698313768.svg)](https://zenodo.org/doi/10.5281/zenodo.10150607)

# KDs

KDs


## Supported Queries
 The supported queries in KDs can be seen at [https://github.com/christinoleo/KDs/blob/c5b6c9dc2ea371e795aae999528b84bf117af59d/frontend/src/lib/store.ts#L29](https://github.com/christinoleo/KDs/blob/c5b6c9dc2ea371e795aae999528b84bf117af59d/frontend/src/lib/store.ts#L29)


## Running

To run, first create a credentials.py file in the root of this project with three variables:

```python
url = # url to a neo4j instance
login = # login to a neo4j instance
password = # its password
```

Then, run the main.py file and either check the app/graph/test folder for examples or go to http://localhost:8888/docs/api to check for the api usage.

## Install dependencies

```bash
pip install -r requirements.txt
```

## Install spacy model

```bash
python -m spacy download en_core_web_md
```

# CITATION

```bib
@software{leonardo_christino_2023_10150608,
  author       = {Leonardo Christino},
  title        = {christinoleo/KDs: 0.0.1},
  month        = nov,
  year         = 2023,
  publisher    = {Zenodo},
  version      = {0.0.1},
  doi          = {10.5281/zenodo.10150608},
  url          = {https://doi.org/10.5281/zenodo.10150608}
}
```
