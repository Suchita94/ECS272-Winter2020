import numpy as np # linear algebra
import pandas as pd # data processing, CSV file I/O (e.g. pd.read_csv)
import os
import json
from flask import Flask, request, render_template
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from collections import defaultdict
app = Flask(__name__, template_folder="templates", static_folder="static", static_url_path="/static")

@app.route("/")
def output():
    return render_template("index.html")

@app.route("/loadData")
def output1():
    df = pd.read_csv('input/responses.csv')
    df.dropna(inplace=True)
    df = processData(df, 3)
    cluster_otherquestion = countsdf(df,["Horror","Thriller","Comedy",	"Romantic","Sci-fi","War","Fantasy/Fairy tales"	,"Animated","Documentary","Western","Action"],3)
    json_data = {'df': df.to_dict(orient="records"),'cluster_otherquestion':cluster_otherquestion.to_dict(orient="records")}
    return json.dumps(json_data)


@app.route("/cluster", methods=["POST"])
def changeCluster():
    df = pd.DataFrame.from_records(json.loads(request.data)["dat"])

    df.drop(columns=['X'], inplace=True, axis = 1)
    df.drop(columns=['Y'], inplace=True, axis = 1)
    df.drop(columns=['cluster'], inplace=True, axis = 1)
    
    df = processData(df, int(json.loads(request.data)["clusterNum"], base=10))

    cluster_otherquestion = countsdf(df,["Movies","Horror","Thriller","Comedy",	"Romantic","Sci-fi","War","Fantasy/Fairy tales"	,"Animated","Documentary","Western","Action"],int(json.loads(request.data)["clusterNum"], base=10))
    json_data = {'df': df.to_dict(orient="records"),'cluster_otherquestion':cluster_otherquestion.to_dict(orient="records")}
    return json.dumps(json_data)


def countsdf(df,questions,n_cluster):
    return_df = pd.DataFrame(columns = ['cluster','question']) 
    for question in questions:
        raw_count_series = df.groupby('cluster')[question].value_counts().unstack().fillna(0)
        raw_count_df = raw_count_series.reset_index()
        raw_count_df['question'] = question
        return_df = return_df.append(raw_count_df,ignore_index=True,sort=False)

        general_count = pd.DataFrame(df[question].value_counts()).T
        general_count['cluster'] = 'all'
        general_count['question'] = question
        
        return_df = return_df.append(general_count,ignore_index=True,sort=False)
           
        
    return(return_df)


def processData(df, clusterNum):
    
    X = np.array(df[['Music','Slow songs or fast songs', 'Dance', 'Folk', 'Country', 'Classical music', 'Musical', 'Pop', 'Rock', 'Metal or Hardrock', 'Punk', 'Hiphop, Rap', 'Reggae, Ska', 'Swing, Jazz', 'Rock n roll', 'Alternative', 'Latino', 'Techno, Trance', 'Opera']])
    print(X[0])

    kmeans = KMeans(n_clusters=clusterNum).fit(X)  #parameters to change
    pca = PCA(n_components=2) #TODO remove PCA data to diff function 
    pca.fit(X)
    X_trans = pca.transform(X) # 2d dimension reduction for x,y axis
    X1 = X_trans[:,0].tolist()
    X2 = X_trans[:,1].tolist()
    labels = kmeans.labels_.tolist()
    df['X'] = X1
    df['Y'] = X2
    df['cluster'] = labels

    return df

if __name__ == "__main__":
	app.run(debug=True)
