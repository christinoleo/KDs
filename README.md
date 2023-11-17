[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.10150663.svg)](https://doi.org/10.5281/zenodo.10150663)


# Knowledge Decks (KD)

Visualization and Visual Analytics (Vi&VA) tools allow users to harness insights and knowledge from datasets. Recalling and retelling user experiences from the usage of such tools has attracted significant interest. Nevertheless, each user session is unique, and the path between start and finish is not always linear. Even when different users have the same intention when using a tool, they may follow different paths and uncover different insights. Currently, those who want to analyze user data are expected to manually collect and process user data. This process is time-consuming, especially when there is the need to gather users' insights and behavior and share them with others. We present Knowledge Decks (KD), a systematic approach that collects user intentions, behavior, and insights during knowledge discovery sessions, automatically structures the collected data as a Knowledge Graph, populates an interface to visualize Knowledge Pathways, which we call storylines, as an intelligently layouted node-link diagram, and generates linear narrations of the knowledge discovery process as PowerPoint slide decks. To evaluate KD, we have attached it to two existing Vi&VA tools where users were asked to perform pre-defined tasks. The KD interface was then shown to experts in the tools. Interviews with the experts showed the relevance of KD in both commercial and research applications when investigating how each tool was utilized when automating the collection of insights and for the quick generation of slide decks containing screenshots and texts from the users' point of view.


## Supported Queries
 The supported queries in KDs can be seen at [https://github.com/christinoleo/KDs/blob/c5b6c9dc2ea371e795aae999528b84bf117af59d/frontend/src/lib/store.ts#L29-L168](https://github.com/christinoleo/KDs/blob/c5b6c9dc2ea371e795aae999528b84bf117af59d/frontend/src/lib/store.ts#L29-L168)


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
@software{leonardo_christino_2023_10150663,
  author       = {Leonardo Christino},
  title        = {christinoleo/KDs: 0.0.2},
  month        = nov,
  year         = 2023,
  publisher    = {Zenodo},
  version      = {0.0.2},
  doi          = {10.5281/zenodo.10150663},
  url          = {https://doi.org/10.5281/zenodo.10150663}
}
```
