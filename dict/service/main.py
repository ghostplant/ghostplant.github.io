#!/usr/bin/env python3

import sqlite3
import tornado
import tornado.httpserver
import tornado.ioloop
import tornado.web
import os, random, traceback, json

con = sqlite3.connect(os.path.dirname(__file__) + "/dictionary.db")


def create_table():
	cur = None
	try:
		cur = con.cursor()
		cur.execute('''create table if not exists data_info(
		    name varchar(100) primary key unique not null,
		    info varchar(10000)
		)''')
		return True
	except:
		return False
	finally:
		try:
			cur.close()
		except:
			pass

def insert_data(name, info, force=False):
	cur = None
	try:
		name = name.strip()
		info = info.strip()
		if len(name) == 0:
			raise Exception("Empty name is not allowed.")
		cur = con.cursor()
		try:
			cur.execute('insert into data_info(name, info) values (?, ?)', (name, info))
			con.commit()
		except:
			if force:
				cur.execute('update data_info set info = ? where name = ?', (info, name))
				con.commit()
		return True
	except:
		# traceback.print_exc()
		return False
	finally:
		try:
			cur.close()
		except:
			pass

def list_names():
	cur = None
	try:
		cur = con.cursor()
		cur.execute('select name from data_info')
		ds = cur.fetchall()
		results = []
		for row in ds:
			results.append(row[0])
		con.commit()
		results.sort(key=lambda x: len(x))
		return results
	except:
		return []
	finally:
		try:
			cur.close()
		except:
			pass

def find_names(subname, like=True):
	cur = None
	try:
		subname = subname.strip()
		if len(subname) == 0:
			return []
		cur = con.cursor()
		if like:
			subname = '%' + subname + '%'
			cur.execute("select * from data_info where name like ?", (subname,))
		else:
			cur.execute("select * from data_info where name = ?", (subname,))
		ds = cur.fetchall()
		results = []
		for row in ds:
			results.append({
				"name": row[0],
				"info": row[1]
			})
		con.commit()
		results.sort(key=lambda x: len(x["name"]))
		return results
	except:
		return []
	finally:
		try:
			cur.close()
		except:
			pass

def remove_data(name):
	cur = None
	try:
		name = name.strip()
		if len(name) == 0:
			raise Exception("Empty name is not allowed.")
		cur = con.cursor()
		cur.execute('delete from data_info where name = ?', (name, ))
		con.commit()
		return True
	except:
		return False
	finally:
		try:
			cur.close()
		except:
			pass

create_table()

"""
insert_data('毒鼠强', '【临床特点】经呼吸道或消化道黏膜迅速吸收后导致严重阵挛性惊厥和脑干刺激的癫痫大发作。【综合疗法】1、迅速洗胃、越早疗效越好；2.清水洗胃后胃管内注入:(1)活性炭50～100g吸附毒物(2)20%～30%硫酸镁导泻；3.保护心肌:静滴极化液，l,6二磷酸果糖和维生素B6；4、禁用阿片类药。【特效疗法】1、抗惊厥：推荐苯巴比妥和地西泮联用(1)地西泮每次10~20mg静注或50~100mg加入10%葡萄糖液250mg静滴，总量200mg(2)苯巴比妥钠0.1g，每6~12小时肌注，用1~3天(3)咖么-羟基丁酸钠60~80mg/(kg*h)静滴(4)异丙酚2~12mg/(kg*h)静滴(5)硫喷妥钠3mg/(kg*h)间断静注，直至抽搐停止(6)二巯基丙磺酸钠，0.125~0.25g每8小时一次，肌注，第1~2天；0.125每12小时一次，肌注，第3~4天；0.125每天一次，肌注，第5~7天。2、血液净化(血液灌流、血液透析、血浆置换)加速毒鼠强排出体外。')
insert_data('氟乙酰胺', '【临床特点】潜伏期短，起病迅速，临床分三型，1、轻型：头痛、头晕、视力模糊、乏力、四肢麻木、抽动、口渴、呕吐、上腹痛；2、中型：除上述症状，尚有分泌物多、烦躁、呼吸困难、肢体痉挛、心肌损害、血压下降；3、重型：昏迷、惊厥、严重心律失常、瞳孔缩小、肠麻痹、二便失禁、心肺功能衰竭。【综合疗法】1、迅速洗胃、越早越好；2、1:5000高锰酸钾溶液或0.15%石灰水洗胃，使其氧化或转化为不易溶解的氟乙酰(酸)钙而减低毒性；3、活性炭：尽早应用活性炭；4、支持治疗：保护心肌、纠正心律失常；惊厥患者在控制抽搐同时应气管插管保护气道；昏迷患者考虑应用高压氧疗法。【特效疗法】1、特效解毒剂：乙酰胺每次2.5~5.0g肌注，3次/天；或按0.1~0.3g/(kg*d)计算总量，分3次肌注。重症患者，首次肌注剂量为全日量的1/2即10g，连用5~7天/疗程；2、血液净化(血液灌流、血液透析)：考虑用于重度中毒患者。')
insert_data('溴鼠隆', '【临床特点】1、早期：恶心、呕吐、腹痛、低热、食欲不佳、情绪不好；2、中晚期:皮下广泛出血,血尿,鼻和牙龈出血,咯血,呕血,便血,心、脑、肺出血,休克。【综合疗法】1、立即清水洗胃，催吐，导泻；2、胃管内注入活性炭50~100g吸附毒物；3、胃管内注入20%~30%硫酸镁导泻。【特效疗法】1、特效对抗剂：根据疗效反应调整剂量(1)PT显著延长者：维生素K1，5~10mg肌注(成人或>12岁儿童)、1~5mg肌注(<12岁儿童)；(2)出血患者：初始剂量维生素K1，10~20mg(成人或>12岁儿童)、5mg肌注(<12岁儿童)，稀释后缓慢静脉注射，根据治疗反应重复剂量，或静滴维持；2、严重出血患者同时输新鲜冰冻血浆300~400ml。')
insert_data('磷化锌', '【临床特点】1、轻者表现：胸闷、咳嗽、口咽/鼻咽发干和灼痛、呕吐、腹痛；2、重者表现：惊厥、抽搐、肌肉抽动、口腔黏膜糜烂、呕吐物有大蒜味；3、严重者表现：肺水肿、脑水肿、心律失常、昏迷、休克。【综合疗法】1、皮肤接触中毒：应更换衣服，清晰皮肤；2、吸入中毒：应立即转移患者，至于空气新鲜处；3、口服中毒：应考虑洗胃、导泻(1)洗胃前：应考虑控制抽搐和气道保护(2)洗胃：反复洗至无磷臭味、澄清液止。不常规推荐用0.2%硫酸铜溶液或1:5000高锰酸钾溶液洗胃(3)导泻：洗胃毕后立即导泻，用硫酸钠20~30g或石蜡油100ml口服导泻。禁用硫酸镁、蓖麻油及其他油类；4、对症支持治疗。【特效疗法】目前尚无特效疗法，临床主要以支持治疗和对症治疗为主。')
insert_data('强碱（浓硫酸，浓硝酸，浓盐酸）', '表现：1、皮肤灼烧；2、吞服致口腔、消化道黏膜腐蚀、休克、食管或胃穿孔，后期食管狭窄。治疗：1皮肤冲洗；2避免洗胃；3饮牛奶、蛋清、氢氧化铝凝胶；4、抗休克，输液，止痛；5防止食管狭窄。')
insert_data('强碱', '1，皮肤冲洗2，保护剂：牛奶、蛋清3，抗休克：输液，止痛。')
insert_data('汞', '高浓度汞蒸气致口腔炎。脱离接触，应用DMPS或DMS.')
insert_data('镉(硫酸镉，氧化镉）', '前者口服急性胃肠炎，后者吸入呼吸道刺激症状，重者4-10小时后肺水肿。1，中毒处理常规2，对症治疗3，吸入者，防治肺水肿。')
insert_data('钡（氯化钡）', '急性胃肠炎，重者低钾血症、四肢瘫痪、呼吸麻痹、心律失常。1，洗胃2，硫酸钠克口服或10%硫酸钠10毫升缓慢静注，30分钟重复2，吸氧4，补钾5，机械通气。')
insert_data('砷化氢', '吸入数小时至1-2天血红蛋白尿，贫血，重者2-3天肾衰。1早用解毒剂2，碱化尿液，防治肾衰。')
insert_data('甲醇', '吸入眼、上呼吸道刺激现象，饮入胃肠炎、意识视力障碍、酸中毒。1纠正酸中毒：碳酸氢钠。')
insert_data('汽油', '饮、吸入头痛、头晕，重者精神失常、昏迷、惊厥、呼吸麻痹。1，避免洗胃免误吸。')
insert_data('煤油', '误吸支气管炎、化学性肺炎。1，肺炎：吸氧、抗生素。')
insert_data('苯', '饮吸入大量，麻醉现象。1，脱离环境。2保持呼吸道通畅。')
insert_data('四氯化碳', '饮、吸入，麻醉、消化道刺激症状，重者肝肾心肌损害。1，保肝。保肾。')
insert_data('刺激性气体(氨、氯、光气二氧化氮）', '眼、呼吸道刺激症状，重者2—24小时肺水肿。1，脱离环境。2，吸氧。3，解气管痉挛。4，防治肺水肿：糖皮质激素，消泡剂，或气管切开。')
insert_data('硫化氢', '吸入眼、呼吸道刺激症状，心悸、肺水肿、昏迷，重者昏迷、惊厥、呼吸停止。1，脱离环境。2，吸氧。3，机械通气。')
insert_data('氰化物（氰化氢、氢化钠、氰化钾）', '吸食入，呼气苦杏仁味，头晕、头痛、嗜睡、呼吸困难、心率快、血压低、皮肤潮红、昏迷、惊厥、呼吸心跳停止。1，脱离环境。2，吸氧。3，解毒药：立即亚硝酸已戊酯吸入，3%亚硝酸納10毫升静脉注射，随即25%硫代硫酸钠50毫升静脉注射。')
insert_data('高铁血红蛋白生成物（亚硝酸盐、苯胺、硝基苯）', '食入亚硝酸盐引起“肠源性紫绀”。吸食入或皮肤吸收苯胺、硝基苯后，紫绀，重者昏迷，抽搐、呼吸衰竭。1，口服者洗胃。2，肥皂、清水洗皮肤。3，吸氧。4，机械通气。')
insert_data('水杨酸类（阿司匹林）', '恶心，呕吐，出汗，面色潮红，出血，呼吸性碱中毒和代谢性酸中毒，低钾血症，低血糖。1，碳酸氢钠溶液碱化尿液。2，纠正低钾血症、代谢性酸中毒。3，维生素K1，10-25毫克肌肉注射。４，血液透析。')
insert_data('阿托品（颠茄，曼陀罗，洋金花，异烟肼）', '口感，吞咽困难，皮肤干燥潮红，瞳孔散大，视力模糊，心动过速，排尿困难，发热，重者谵妄，幻觉，躁动，抽搐，昏迷。１，躁动：地西泮１０毫克肌注。２，惊厥：地西泮，苯巴比妥。３，解毒药：维生素Ｂ６200-400毫克一天，静脉输入。4，烟酰胺400毫克一天，静脉滴注。')
insert_data('乌头（附子，雪上一支蒿）', '口舌四肢麻木，肌强直，抽搐，呕吐，腹泻，心动过缓，心律失常，呼吸循环衰竭。嗜睡，肌颤，惊厥，呼吸肌痉挛和窒息。1解毒药：阿托品。2，抗心律失常：阿托品等。3，复苏措施。')
insert_data('氟乙酰胺', '【临床特点】进入机体后脱氨形成氟乙酸，进而合成氟柠檬酸，抑制乌头酸酶，使柠檬酸不能代谢产生乌头酸，导致中断三羧酸循环，称之为“致死代谢合成”。同时柠檬酸在组织内大量积聚，丙酮酸代谢受阻，使心、脑、肺、肝、肾的脏器细胞产生难以逆转的病理改变，脏器细胞发生变性、坏死。导致肺水肿、脑水肿。聚积的氟乙酸、氟柠檬酸对神经系统也有直接刺激作用。')
"""


class DataHandler(tornado.web.RequestHandler):
	@tornado.gen.coroutine
	def post(self, path):
		self.set_status(200)
		self.set_header("Content-Type", "application/json")
		try:
			data = self.request.body.decode('utf8')
			result = json.loads(data)
			if 'subname' in result:
				outs = find_names(result['subname'])
				result = outs
			elif 'delname' in result:
				remove_data(result['delname'])
				result = []
			elif 'name' not in result:
				names = list_names()
				result = names
			elif 'info' not in result:
				outs = find_names(result['name'], like=False)
				result = outs
			else:
				insert_data(result['name'], result['info'], force=True)
				result = []
			retCode = 0
		except:
			result = None
			retCode = 1
		data = json.dumps({
			'retCode': retCode,
			'body': result,
		})
		self.write(data)


class IndexHandler(tornado.web.RequestHandler):
	@tornado.gen.coroutine
	def get(self):
		self.redirect('/static/index.html')


app = tornado.web.Application([
		(r"/rest/(.*)", DataHandler),
		(r"/", IndexHandler),
	],
	static_path = os.path.join(os.path.dirname(__file__), "static"),
	cookie_secret = str(random.random()),
	debug = False,
)

app.port = 80
	
print("* Server listening on ':%d'" % app.port)
tornado.httpserver.HTTPServer(app).listen(app.port)
tornado.ioloop.IOLoop.current().start()

