from google.adk.agents.llm_agent import Agent
from google.adk.tools import FunctionTool

from psycopg2.extras import RealDictCursor
import psycopg2

import pandas as pd
import os

# Cria a tool
def execute_query(sql_query: str):
        """
        Executa uma query SQL no banco e retorna o resultado em um dicionário.

        Args:
            sql_query (str): A consulta SQL a ser executada.
        Returns:
            dict: Um dicionário contendo o status e o resultado ou mensagem de erro.
        """
        try:
            # Conexão ao banco
            conn = psycopg2.connect(
                host="grupo3-agent-db.c7bh93xirm1i.us-east-1.rds.amazonaws.com",
                dbname="postgres",
                user="postgres",
                password="12345678",
                port=5432
            )
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            # Execução da query
            cursor.execute(sql_query)
            
            # Se for SELECT, retorna resultados
            if sql_query.strip().lower().startswith("select"):
                result = cursor.fetchall()
                df = pd.DataFrame(result)
                output = df.to_dict(orient="records")
            else:
                conn.commit()
                output = {"message": "Query executada com sucesso."}

            # Fecha a conexão
            cursor.close()
            conn.close()

            return {"status": "success", "result": output}

        except Exception as e:
            return {"status": "error", "message": str(e)}



TABLES = """
name: solicitacoes
    description: Tabela contendo registros de solicitacoes feitas no SISREG.
    columns:
        - name: profissional_solicitante_id
        description: Codigo unico que representa o profissional que fez a solicitacao.
        
        - name: operador_solicitante_id
        description: Identificador do operador que registrou a solicitacao.
        
        - name: operador_cancelamento_id
        description: Identificador do operador que cancelou a solicitacao.
        
        - name: central_solicitante
        description: Nome da central solicitante.
        
        - name: central_reguladora
        description: Nome da central reguladora.
        
        - name: unidade_solicitante_id_cnes
        description: Codigo CNES da unidade de saude que abriu a solicitacao.
        
        - name: unidade_desejada_id_cnes
        description: Codigo CNES da unidade onde se pretende realizar o procedimento.
        
        - name: paciente_id
        description: Identificador do paciente.
        
        - name: paciente_sexo
        description: Sexo biologico do paciente.
        
        - name: paciente_faixa_etaria
        description: Faixa etaria calculada a partir da data de nascimento.
        
        - name: solicitacao_id
        description: Chave primaria da solicitacao no sistema.
        
        - name: data_solicitacao
        description: Data e hora em que a solicitacao foi criada.
        
        - name: data_desejada
        description: Data e hora pretendida para o procedimento solicitado.
        
        - name: data_cancelamento
        description: Data e hora em que a solicitacao foi cancelada.
        
        - name: data_atualizacao
        description: Data e hora da ultima alteracao na solicitacao.
        
        - name: solicitacao_status
        description: Estado atual da solicitacao.
        
        - name: solicitacao_situacao
        description: Estado atual da solicitacao.
        
        - name: solicitacao_visualizada_regulador
        description: Flag que indica se o regulador ja visualizou a solicitacao.
        
        - name: solicitacao_risco
        description: Nivel de risco clinico associado (Azul, Verde, ... , Vermelho)
        
        - name: procedimento_sisreg_id
        description: Codigo do procedimento solicitado no SISREG.
        
        - name: vaga_solicitada_tp
        description: Tipo de vaga solicitada.
        
        - name: cid_id
        description: Codigo CID que descreve o diagnostico relacionado.
        
        - name: laudo_descricao_tp
        description: Tipo de laudo.
        
        - name: laudo_situacao
        description: Status do laudo.
        
        - name: laudo_data_observacao
        description: Data e hora em que observacoes foram adicionadas ao laudo.
    
    

name: marcacao
    description: Tabela contendo registros de marcacoes feitas no SISREG.
    columns:
        - name: profissional_solicitante_id
        description: Identificador do profissional que solicitou o agendamento.
        
        
        - name: profissional_executante_id
        description: Identificador do profissional que realizou o procedimento.
        
        
        - name: operador_solicitante_id
        description: Identificador do operador que registrou a solicitacao.
        
        
        - name: operador_autorizador_id
        description: Identificador do operador que aprovou a marcacao.
        
        
        - name: operador_cancelamento_id
        description: Identificador do operador que cancelou a marcacao.
        
        
        - name: operador_videofonista_id
        description: Identificador do operador responsavel por confirmacao via telefone ou video.
        
        
        - name: central_solicitante
        description: Nome da central solicitante.
        
        
        - name: central_reguladora
        description: Nome da central reguladora.
        
        
        - name: unidade_solicitante_id_cnes
        description: Codigo CNES da unidade que pediu o agendamento.
        
        
        - name: unidade_desejada_id_cnes
        description: Codigo CNES da unidade preferida pelo paciente.
        
        
        - name: unidade_executante_id_cnes
        description: Codigo CNES da unidade que executou o procedimento.
        
        
        - name: paciente_id
        description: Identificador do paciente.
        
        
        - name: paciente_sexo
        description: Sexo biologico do paciente.
        
        
        - name: paciente_faixa_etaria
        description: Faixa etaria do paciente.
        
        
        - name: solicitacao_id
        description: Identificador da solicitacao original associada.
        
        
        - name: data_solicitacao
        description: Data e hora em que a solicitacao foi registrada.
        
        
        - name: data_desejada
        description: Data e hora pretendida para o atendimento.
        
        
        - name: data_aprovacao
        description: Data em que a solicitacao recebeu aprovacao.
        
        
        - name: data_confirmacao
        description: Data em que o agendamento foi confirmado.
        
        
        - name: data_marcacao
        description: Data em que o procedimento sera realizado.
        
        
        - name: data_cancelamento
        description: Data em que a marcacao foi cancelada.
        
        
        - name: data_atualizacao
        description: Data da ultima alteracao no registro.
        
        
        - name: solicitacao_status
        description: Estado da solicitacao.
        
        
        - name: solicitacao_situacao
        description: Estado da solicitacao.
        
        
        - name: solicitacao_visualizada_regulador
        description: Flag que indica se o regulador ja visualizou a solicitacao.
        
        
        - name: solicitacao_risco
        description: Nivel de risco clinico associado (Azul, Verde, ... , Vermelho)
        
        
        - name: paciente_avisado
        description: Flag que indica se o paciente foi notificado.
        
        
        - name: marcacao_executada
        description: Indica se o atendimento ocorreu conforme marcado.
        
        
        - name: falta_registrada
        description: Indica se houve falta do paciente.
        
        
        - name: procedimento_sisreg_id
        description: Codigo do procedimento marcado no SISREG.
        
        
        - name: vaga_solicitada_tp
        description: Tipo de vaga solicitada.
        
        
        - name: vaga_consumida_tp
        description: Tipo de vaga efetivamente utilizada.
        
        
        - name: cid_solicitado_id
        description: CID informado na solicitacao.
        
        
        - name: cid_agendado_id
        description: CID utilizado no agendamento final.
        
        
        - name: laudo_descricao_tp
        description: Tipo de laudo.
        
        
        - name: laudo_situacao
        description: Status do laudo associado.
        
        
        - name: laudo_data_observacao
        description: Data da ultima observacao no laudo.
    
    

name: tempo_espera
    description: Tabela contendo indicadores de tempo de espera de procedimentos no SISREG.
    columns:
        - name: ano_marcacao
        description: Ano em que o procedimento foi agendado.
        
        - name: mes_marcacao
        description: Mes em que o procedimento foi agendado.
        
        - name: procedimento
        description: Nome do procedimento analisado.
        
        - name: n_execucoes
        description: Numero de execucoes do procedimento no periodo.
        
        - name: tempo_medio_espera
        description: Media, em dias, entre solicitacao e execucao.
        
        - name: tempo_espera_mediano
        description: Mediana, em dias, dos tempos de espera.
        
        - name: tempo_espera_90_percentil
        description: Valor abaixo do qual 90 por cento dos atendimentos ocorreram.
        
        - name: tempo_espera_desvio_padrao
        description: Desvio padrao dos tempos de espera.
        
        - name: intervalo_confianca_95_inferior
        description: Limite inferior do IC 95 por cento para a media de espera.
        
        - name: intervalo_confianca_95_superior
        description: Limite superior do IC 95 por cento para a media de espera.
        
        - name: tempo_medio_espera_movel_3m
        description: Media movel de 3 meses dos tempos de espera.

        - name: tempo_medio_espera_movel_6m
        description: Media movel de 6 meses dos tempos de espera.
        
        - name: tempo_medio_espera_movel_12m
        description: Media movel de 12 meses dos tempos de espera.
    
    

name: procedimento
    description: Tabela contendo procedimentos oferecidos no SISREG e suas caracteristicas.
    columns:
        - name: procedimento_sisreg_id
        description: Codigo identificador do procedimento no SISREG.
        
        - name: procedimento
        description: Nome completo do procedimento.
        
        - name: procedimento_tipo
        description: Categoria geral do procedimento.
        
        - name: procedimento_especialidade
        description: Especialidade medica relacionada ao procedimento.
        
        - name: vagas_esperadas_hora
        description: Quantidade prevista de vagas por hora.
        
        - name: proporcao_esperada_primeira_vez
        description: Percentual planejado para pacientes de primeira vez ou reserva.
        
        - name: proporcao_esperada_retorno
        description: Percentual planejado para consultas de retorno.
    
    

name: unidade_historico
    description: Tabela proveniente do CNES com informacoes de unidades de saude no Municipio do Rio de Janeiro.
    columns:
        - name: ano
        description: Ano da competencia do registro.
        
        - name: mes
        description: Mes da competencia do registro.
        
        - name: unidade_id_cnes
        description: Codigo CNES da unidade de saude.
        
        - name: unidade_nome
        description: Nome da unidade.
        
        - name: unidade_esfera
        description: Nivel administrativo (municipal publico, municipal privado, estadual, ...).
        
        - name: unidade_tipo
        description: Tipo especifico de estabelecimento.
        
        - name: unidade_tipo_agrupado
        description: Agrupamento mais amplo do tipo de unidade.
        
        - name: unidade_gestao
        description: Orgao gestor responsavel pela unidade.
        
        - name: unidade_nat_jur
        description: Natureza juridica da unidade.
        
        - name: unidade_turno_atendimento
        description: Turnos de funcionamento.
        
        - name: unidade_area_programatica
        description: Area programatica onde a unidade esta situada.
        
        - name: unidade_bairro
        description: Bairro onde a unidade esta situada.
        
        - name: unidade_latitude
        description: Coordenada latitude em graus decimais.
        
        - name: unidade_longitude
        description: Coordenada longitude em graus decimais.
        
        - name: indicador_unidade_ativa
        description: Flag que sinaliza se a unidade estava ativa (1 ou 0).
        
        - name: indicador_unidade_sms
        description: Indica participacao na rede da Secretaria Municipal de Saude (1 sim, 0 nao).
        
        - name: indicador_unidade_sus
        description: Indica participacao no SUS em qualquer modalidade (1 sim, 0 nao).
        
        - name: indicador_unidade_sus_internacao
        description: Indica se oferece leitos SUS (1 sim, 0 nao).
        
        - name: indicador_unidade_sus_ambulatorial
        description: Indica se oferece servicos ambulatoriais SUS (1 sim, 0 nao).
        
        - name: indicador_unidade_sus_sadt
        description: Indica se oferece servicos de diagnostico e terapia SUS (1 sim, 0 nao).
        
        - name: indicador_unidade_sus_urgencia
        description: Indica se possui pronto atendimento SUS (1 sim, 0 nao).
        
        - name: indicador_unidade_sus_vigilancia
        description: Indica se realiza atividades de vigilancia em saude SUS (1 sim, 0 nao).
        
        - name: indicador_unidade_sus_regulacao
        description: Indica se participa de processos de regulacao SUS (1 sim, 0 nao).
        
        - name: indicador_unidade_sus_outros
        description: Indica outros servicos SUS nao classificados acima (1 sim, 0 nao).
    
    
name: profissional_historico
    description: Tabela proveniente do CNES com informacoes de profissionais de saude no Municipio do Rio de Janeiro.
    columns:
        - name: ano
        description: Ano da competenca do registro.
        
        - name: mes
        description: Mes da competenca do registro.
        
        - name: unidade_id_cnes
        description: Codigo CNES da unidade onde o profissional atua.
        
        - name: profissional_id
        description: Identificador do profissional.
        
        - name: profissional_ocupacao
        description: Familia ocupacional principal segundo CBO.
        
        - name: profissional_ocupacao_especifica
        description: Ocupacao especifica segundo CBO detalhado.
        
        - name: profissional_vinculo
        description: Tipo de vinculo geral.
        
        - name: profissional_vinculo_especifico
        description: Detalhe adicional do tipo de contrato.
        
        - name: profissional_carga_horaria_semanal_ambulatorial
        description: Horas semanais dedicadas ao ambulatorio.
        
        - name: profissional_carga_horaria_semanal_hospitalar
        description: Horas semanais dedicadas a atividades hospitalares.
        
        - name: profissional_carga_horaria_semanal_outros
        description: Horas semanais em outras atividades.
        
        - name: profissional_carga_horaria_semanal_total
        description: Soma de todas as cargas horarias semanais.
        
        

name: leito_historico
    description: Tabela proveniente do CNES com informacoes de leitos de saude no Municipio do Rio de Janeiro.
    columns:
        - name: ano
        description: Ano da competencia do leito.
        
        - name: mes
        description: Mes da competencia do leito.
        
        - name: unidade_id_cnes
        description: Codigo CNES da unidade detentora do leito.
        
        - name: leito
        description: Tipo de leito (clinico, UTI adulto etc.).
        
        - name: leito_especialidade
        description: Especialidade a que o leito esta vinculado.
        
        - name: leito_quantidade_sus
        description: Numero de leitos disponiveis para o SUS.
        
        
        - name: leito_quantidade_contratado
        description: Numero de leitos contratados.
        
        - name: leito_quantidade_total
        description: Total de leitos disponiveis na unidade.
        
    

name: habilitacao_historico
    description: Tabela proveniente do CNES com informacoes de habilitacoes de unidades de saude no Municipio do Rio de Janeiro.
    columns:
        - name: ano
        description: Ano da competenca da habilitacao.
        
        - name: mes
        description: Mes da competenca da habilitacao.
        
        - name: unidade_id_cnes
        description: Codigo CNES da unidade habilitada.
        
        - name: habilitacao
        description: Tipo de habilitacao concedida.
        
        - name: habilitacao_ano_inicio
        description: Ano em que a habilitacao iniciou.
        
        - name: habilitacao_ano_fim
        description: Ano em que a habilitacao encerrou.
        
        - name: habilitacao_mes_inicio
        description: Mes em que a habilitacao iniciou.
        
        - name: habilitacao_mes_fim
        description: Mes em que a habilitacao encerrou.

        - name: habilitacao_ativa_indicador
        description: Flag 1 se a habilitacao esta ativa, 0 caso contrario.
        
    

name: equipamento_historico
    description: Tabela proveniente do CNES com informacoes de equipamentos de unidades de saude no Municipio do Rio de Janeiro.
    columns:
        - name: ano
        description: Ano da competencia do equipamento.
        
        - name: mes
        description: Mes da competencia do equipamento.
        
        - name: unidade_id_cnes
        description: Codigo CNES da unidade que possui o equipamento.
        
        - name: equipamento
        description: Categoria geral do equipamento (tomografo, raio X etc.).
        
        - name: equipamento_especifico
        description: Descricao detalhada do equipamento (ex. tomografo 64 canais).
        
        - name: equipamentos_quantidade
        description: Quantidade total de unidades do equipamento.
        
        - name: equipamentos_quantidade_ativos
        description: Quantidade de unidades em funcionamento.
        
    

name: cid
    description: Tabela contendo classificacoes da CID (Classificacao Internacional de Doencas).
    columns:
        - name: cid_id
        description: Codigo unico para a doenca na CID-10.
        
        - name: cid
        description: Descricao textual da doenca.
        
        - name: cid_categoria
        description: Categoria intermediaria na hierarquia CID-10.
        
        - name: cid_capitulo
        description: Capitulo superior da CID-10 que agrupa categorias relacionadas.
        
        - name: cid_grupo
        description: Grupo dentro do capitulo que refina ainda mais a classificacao.
        
    """

JUNCAO_TABELAS = """
As tabelas de histórico apresentam atributos comuns, sempre com os mesmos nomes: ano, mes e unidade_id_cnes. Esses padrões facilitam a realização de junções e análises comparativas.
Outro aspecto relevante são os identificadores (IDs), que permitem relacionar informações entre diferentes tabelas. Os principais são: 
cid_id: código único que representa uma doença, seguindo o padrão da Classificação Internacional de Doenças (CID-10).  


unidade_id_cnes: código atribuído a cada estabelecimento de saúde, conforme o Cadastro Nacional de Estabelecimentos de Saúde (CNES).  


profissional_id: identificador numérico de cada profissional de saúde presente no banco.  
Ainda tratando sobre atributos comuns entre tabelas, é importante ressaltar que não existe um único campo capaz de conectar todas elas de forma direta. Entretanto, alguns atributos estão presentes em diferentes tabelas e podem ser utilizados como pontos de ligação. Vale destacar, ainda, a relevância das tabelas Solicitação e Marcação, que concentram um grande número de atributos e podem atuar como intermediárias para estabelecer conexões com outras tabelas.
 A seguir, são listados alguns atributos e as respectivas tabelas em que aparecem: 
ano e mes: presentes em Equipamento histórico, Habilitação histórico, Leito histórico, Unidade histórico, Profissional histórico, Oferta programada e Tempo espera.


unidade_id_cnes / unidade_solicitante_id_cnes: encontrados em Equipamento histórico, Habilitação histórico, Leito histórico, Unidade histórico, Profissional histórico, Solicitação e Marcação.


cid / cid_id: presentes em Cid, Marcação e Solicitação.


profissional_id / profissional_solicitante_id: presentes em Solicitação, Profissional histórico, Oferta programada e Marcação.
    
paciente_id: encontrados em Solicitação e Marcação.


Entre os atributos citados acima, o unidade_id_cnes / unidade_solicitante_id_cnes (CNES) merece destaque, pois conecta diversas tabelas, incluindo as tabelas de histórico, além de Solicitação e Marcação. Ela é extremamente útil para qualquer análise aprofundada.

"""

root_agent = Agent(
    model='gemini-2.5-flash',
    name='NL2SQL',
    description='An agent that translates natural language to SQL queries',
    instruction=f"""
                Você é um agente especializado em traduzir solicitações em linguagem natural para consultas SQL PostgreSQL corretas, otimizadas e legíveis. 
                Seu papel é analisar o texto recebido e gerar **apenas** uma consulta SQL funcional, seguindo o raciocínio abaixo antes de criar a query.

                ---

                ## Etapas obrigatórias de raciocínio (internas)

                1. **Identificar as colunas e funções de agregação**
                - Determine quais colunas são mencionadas ou implícitas no pedido.
                - Se o usuário pedir médias, somas, contagens, máximos ou mínimos, use a função de agregação apropriada:
                    - AVG() → média
                    - SUM() → soma
                    - COUNT() → contagem
                    - MAX() / MIN() → valor máximo / mínimo
                - Se não houver agregação, apenas selecione as colunas necessárias.

                2. **Determinar as tabelas e relacionamentos (JOINs)**
                - Verifique de quais tabelas vêm as colunas.
                - Se todas estiverem na mesma tabela, **não use JOIN**.
                - Caso contrário, determine:
                    - Quais tabelas devem ser unidas.
                    - Qual coluna deve ser usada na condição `ON`.
                    - Use `INNER JOIN` por padrão, a menos que o contexto indique outro tipo.

                3. **Definir filtros (cláusula WHERE)**
                - Se houver condições de filtragem (ex: “apenas escolas públicas”, “ano = 2024”), adicione cláusula WHERE.
                - Use operadores SQL adequados: `=`, `>`, `<`, `LIKE`, `IN`, `BETWEEN`, etc.

                4. **Agrupamentos (GROUP BY)**
                - Caso exista alguma função de agregação e a consulta precise agrupar resultados, adicione `GROUP BY` com as colunas não agregadas.
                - Exemplo: “média por escola” → `GROUP BY escola`.

                5. **Ordenação e Limite (ORDER BY / LIMIT)**
                - Se o pedido contiver ordenação (“maiores valores”, “mais recentes”, etc.), adicione `ORDER BY` e a direção (`ASC` ou `DESC`).
                - Se o pedido contiver limite (“os 10 primeiros”), use `LIMIT`.

                ---

                Após seguir estas etapas e gerar a consulta SQL correta, use a execute_query tool para executar a consulta e obter os resultados.
                Caso ocorra algum erro apenas diga ao usuário que houve um erro e especifique.
                            
                ## Schemas das tabelas disponíveis
                    {TABLES}
                
                ## Dicas para junção de tabelas
                    {JUNCAO_TABELAS}
                """
                ,
                tools=[execute_query]
)
