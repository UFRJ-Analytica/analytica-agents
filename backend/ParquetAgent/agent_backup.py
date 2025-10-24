from google.adk.agents import Agent
#from tools import *
import pandas as pd
import os

# Função para carregar arquivos Parquet
def load_parquet_files(folder_path="backend\dados"):
    """
    Carrega todos os arquivos Parquet presentes na pasta especificada.
    Retorna um dicionário de DataFrames, onde cada chave é o nome do arquivo sem extensão.
    
    Entrada:
        folder_path (str): Caminho da pasta que contém os arquivos Parquet. Padrão é "dados".
    
    Saída:
        dict: Dicionário com {nome_do_arquivo: pd.DataFrame}.
    """
    files = [f for f in os.listdir(folder_path) if f.endswith(".parquet")]
    dataframes = {}
    for file in files:
        df_name = file.replace(".parquet", "")
        df_path = os.path.join(folder_path, file)
        dataframes[df_name] = pd.read_parquet(df_path)
    return dataframes

# Função para realizar joins automáticos
def join_dataframes(dataframes):
    """
    Realiza joins automáticos entre múltiplos DataFrames. 
    Para cada par de DataFrames, identifica colunas em comum e aplica join do tipo inner.
    
    Entrada:
        dataframes (dict): Dicionário com {nome_do_arquivo: pd.DataFrame}.
    
    Saída:
        pd.DataFrame: DataFrame final resultante da combinação de todos os DataFrames.
    """
    dfs = list(dataframes.values())
    df_final = dfs[0]
    for df in dfs[1:]:
        common_cols = list(set(df_final.columns).intersection(set(df.columns)))
        if common_cols:
            df_final = df_final.merge(df, on=common_cols)
    return df_final

# Função para consultar dados
def query_parquet_tool(prompt: str) -> str:
    """
    Consulta os dados dos arquivos Parquet carregados e combinados, filtrando colunas mencionadas no prompt.
    Caso não haja correspondência de colunas, retorna as primeiras linhas do DataFrame combinado.
    
    Entrada:
        prompt (str): Texto do usuário indicando quais colunas ou informações deseja visualizar.
    
    Saída:
        str: Representação em texto das primeiras linhas do DataFrame filtrado ou completo.
    """
    dataframes = load_parquet_files(r"C:\Users\arthur.pinheiro_ipne\Desktop\analityca-agents\backend\dados")
    df_final = join_dataframes(dataframes)
    cols = [col for col in df_final.columns if col.lower() in prompt.lower()]
    if cols:
        result = df_final[cols].head(10)
    else:
        result = df_final.head(10)
    return result.to_string()

root_agent = Agent(
    model='gemini-2.5-flash',
    name='ParquetAgent',
    description='Você é um agente que consulta dados de saúde carregados e combinados. Use as ferramentas disponíveis para responder às perguntas do usuário com base nos dados.',
    instruction='Você tem acesso a ferramentas que permitem carregar, combinar e consultar dados do Datalake de Saúde. ' \
                'Use essas ferramentas para responder às perguntas do usuário com base nos dados disponíveis.'\
                'Se o usuário fizer uma pergunta que não pode ser respondida com os dados, informe educadamente que você não tem essa informação.'\
                'Seu fluxo de execução deve ser a seguinte:'\
                '1. Analise as colunas disponíveis nos arquivos carregados'\
                '2. Entenda quais colunas devem ser utilizadas para fazer consulta nestes arquivos baseado no prompt do usuário.'\
                '3. Use a ferramenta query_parquet_tool para consultar os dados e obter as informações solicitadas pelo usuário.'\
                '4. Forneça a resposta ao usuário com base nos dados obtidos.'\
                ,
    tools=[query_parquet_tool]#, join_dataframes, load_parquet_files],
)
