/* =========================================================================
   DASHERS — card deck.  Every "answer" below is the genuine one.

   Two rules were used writing these, and they matter if you add your own:

   1. OBSCURE.  If a decent pub quiz team would know it, it's a bad card.
      The fun is that nobody at the table has any idea.

   2. WRITE LIKE A PERSON.  If every real answer is a tidy, complete,
      encyclopaedic sentence and every player writes a scrappy one, the
      real answer glows in the dark. So these vary — some are three words,
      some ramble, some are fragments, some start with "It" or "No".

   Add your own by appending [prompt, real answer] pairs to any category.
   ========================================================================= */

const CATEGORIES = [
  { key:"words", name:"Words", blurb:"An obscure real word",
    task:"Invent its definition",
    help:"This is a real word from the dictionary — just a very obscure one. Write a definition convincing enough to pass for the real thing.",
    hint:"A definition…" },

  { key:"initials", name:"Initials", blurb:"A real abbreviation",
    task:"Invent what it stands for",
    help:"These are real initials that genuinely stand for something. Write what you reckon each letter stands for.",
    hint:"It stands for…" },

  { key:"dates", name:"Dates", blurb:"A real date in history",
    task:"Invent what happened",
    help:"Something genuinely notable happened on this date. Write an event convincing enough that people believe it.",
    hint:"On this day…" },

  { key:"people", name:"People", blurb:"A real person",
    task:"Invent what they're known for",
    help:"This is a real person who really existed. Write what they were famous for.",
    hint:"They were the person who…" },

  { key:"movies", name:"Movies", blurb:"A real film title",
    task:"Invent the plot",
    help:"This is a real film that genuinely exists. Write its plot in a sentence.",
    hint:"The film in which…" },

  { key:"studies", name:"Scientific Studies", blurb:"A real, unusual study",
    task:"Invent what the researchers found",
    help:"This is the title of a real scientific study that was actually carried out. Write what you think the researchers concluded.",
    hint:"The researchers found that…" },

  { key:"business", name:"Bizarre Businesses", blurb:"A real or defunct company",
    task:"Invent what it sells or does",
    help:"This is a real company — some still trading, some long gone. Write what it sells, or what it did.",
    hint:"The company that…" }
];

const DECK = {

words:[
 ["BORBORYGMUS","The rumbling your stomach makes."],
 ["SNOLLYGOSTER","Someone with no principles and a great deal of cunning. Usually a politician."],
 ["GRIFFONAGE","Terrible handwriting."],
 ["PSITHURISM","That sound the wind makes in trees."],
 ["MATUTOLYPEA","Waking up in a foul mood for no particular reason."],
 ["QUOMODOCUNQUIZE","To make money by whatever means present themselves, honest or otherwise."],
 ["GARDYLOO","What you shouted out of an upstairs window before emptying the chamber pot into the street below."],
 ["VELLEITY","Wanting something, but not enough to actually do anything about it."],
 ["HIRQUITALLIENCE","How strong someone's voice is."],
 ["JENTACULAR","To do with breakfast."],
 ["GRIMTHORPE","To restore an old building badly. Lots of money, no taste."],
 ["APRICITY","The warmth of the sun in winter."],
 ["PANDICULATION","That full-body stretch and yawn you do on waking."],
 ["ULTRACREPIDARIAN","Someone who holds forth confidently on things they know nothing about."],
 ["GROKE","To stare at someone who's eating in the hope of being given some. Usually a dog."],
 ["SCROOP","The rustle of silk."],
 ["WITZELSUCHT","Compulsive joking and punning, and all of it bad. Can be a sign of damage to the frontal lobe."],
 ["QUAKEBUTTOCK","Coward. Literally, one whose buttocks quake."]
],

initials:[
 ["Y.K.K.  (on zips)","Yoshida Kogyo Kabushikigaisha. A Japanese firm that makes roughly half the zips on earth."],
 ["W.D.-40","Water Displacement, 40th formula. The first thirty-nine didn't work."],
 ["T.A.S.E.R.","Thomas A. Swift's Electric Rifle, after a boys' adventure novel the inventor loved as a child."],
 ["G.E.I.C.O.","Government Employees Insurance Company."],
 ["I.K.E.A.","Ingvar Kamprad Elmtaryd Agunnaryd. His name, his family's farm, his village."],
 ["Q.A.N.T.A.S.","Queensland and Northern Territory Aerial Services."],
 ["A.L.D.I.","Albrecht Diskont. The brothers' surname, and the German for discount."],
 ["A.S.D.A.","Asquith and Dairies — a butcher's and a dairy firm that merged."],
 ["S.A.A.B.","Svenska Aeroplan Aktiebolaget. Swedish Aeroplane Company."],
 ["F.I.A.T.","Fabbrica Italiana Automobili Torino."],
 ["N.A.B.I.S.C.O.","National Biscuit Company."],
 ["M.G.  (the cars)","Morris Garages."],
 ["H.P.  (the sauce)","Houses of Parliament. The maker heard it was being served in the Commons restaurant and put it on the label."],
 ["D.E.R.V.  (on fuel pumps)","Diesel Engined Road Vehicle."],
 ["S.W.A.L.K.","Sealed With A Loving Kiss. Written on the back of the envelope."],
 ["Wi-Fi","Nothing. A branding agency made it up because it sounded a bit like hi-fi."],
 ["S.P.Q.R.","Senatus Populusque Romanus. The senate and people of Rome."],
 ["A.M.B.E.R. Alert","America's Missing: Broadcast Emergency Response. Named to fit a girl called Amber Hagerman."]
],

dates:[
 ["15 January 1919","In Boston a storage tank burst, and a wave of molasses went down the street at about 35 miles an hour. Twenty-one people died."],
 ["17 October 1814","At a London brewery a vat gave way. Something like 300,000 gallons of beer flooded the parish, and eight people drowned in it."],
 ["3 March 1876","Flakes of meat fell out of a clear sky over a farm in Kentucky."],
 ["30 June 1908","Something exploded over Siberia and flattened eighty million trees. No crater was ever found."],
 ["15 August 1977","An Ohio telescope picked up a 72-second signal from deep space. The astronomer on duty wrote 'Wow!' in the margin of the printout."],
 ["6 December 1917","In Halifax harbour a munitions ship caught fire and detonated. Biggest man-made explosion there had ever been, until the atomic bomb."],
 ["5 December 1952","Fog settled over London, so thick with coal smoke that thousands died in the weeks that followed."],
 ["30 August 1904","The St Louis Olympic marathon. The first man over the line had ridden much of it in a car. The actual winner was given rat poison and brandy by his own trainers."],
 ["23 May 1618","Two officials were thrown out of a castle window in Prague. They landed in a dung heap, survived, and the Thirty Years' War started."],
 ["July 1518","People in Strasbourg started dancing in the streets and couldn't stop. It went on for weeks. Some of them died."],
 ["2 November 1932","Australia sent soldiers with machine guns to deal with the emus. The emus won."],
 ["6 July 1944","In Hartford a circus big top caught fire during the afternoon performance. 167 people died."],
 ["5 December 1872","The Mary Celeste was found drifting in the Atlantic — undamaged, well stocked and completely empty."],
 ["January 897","One pope had his predecessor dug up, dressed in his vestments, propped on a throne and put on trial."],
 ["June 1858","The Thames smelled so appalling that Parliament hung lime-soaked curtains at the windows, gave up, and passed a bill to build the sewers."],
 ["1 April 1957","The BBC ran a report on the Swiss spaghetti harvest, with footage of farmers picking pasta off trees."],
 ["16 July 1439","Kissing was banned in England, to slow the plague."],
 ["9 August 1173","They laid the foundations of the bell tower at Pisa. By the second floor it was already leaning."]
],

people:[
 ["Violet Jessop","Stewardess. Aboard the Olympic when it collided, the Titanic when it sank and the Britannic when it went down. Survived all three."],
 ["Stanislav Petrov","Soviet duty officer. In 1983 his screen said five American missiles were on their way. He decided it was a glitch and reported nothing. It was a glitch."],
 ["Timothy Dexter","Got rich taking terrible advice literally — shipping coal to Newcastle, warming pans to the West Indies — and it kept coming off. Wrote a book with no punctuation in it at all."],
 ["Mary Toft","In 1726 she convinced a string of doctors, and briefly the king's own surgeon, that she was giving birth to rabbits."],
 ["William Buckland","Geologist. Set out to eat his way through the animal kingdom, and is said to have got through a mummified heart belonging to a French king."],
 ["Jeanne Baret","Dressed as a man to get aboard a round-the-world expedition, and so became the first woman to circumnavigate the globe."],
 ["Wojtek","He was a bear. Enlisted as a private in the Polish army, drank beer, smoked, and carried ammunition crates at Monte Cassino."],
 ["Jack","Not a man at all — a baboon. Worked nine years as a signalman on the South African railways and never once got it wrong."],
 ["Joshua Norton","Declared himself Emperor of the United States in 1859. San Francisco went along with it for twenty years and honoured the banknotes he printed."],
 ["Roy Sullivan","Park ranger. Hit by lightning on seven separate occasions and survived the lot."],
 ["Poon Lim","Spent 133 days alone on a raft in the Atlantic after his ship was torpedoed, and walked off it."],
 ["Ignaz Semmelweis","Worked out that doctors washing their hands would stop mothers dying. His colleagues took it so badly he died in an asylum."],
 ["Nikolai Vavilov","Built the world's first seed bank. Starved to death in a Soviet prison."],
 ["Adam Rainer","The only person on record to have been both a dwarf and a giant — a tumour started him growing again in his twenties."],
 ["Sarah Winchester","Rifle heiress. Kept builders working on her house for decades — there are staircases in it that run straight into the ceiling."],
 ["Ching Shih","Commanded a pirate fleet of hundreds of ships in the South China Sea, then negotiated a pardon and retired comfortably."],
 ["Charles Domery","Polish soldier with an appetite nobody could explain. Under observation he got through a cat, several candles and about five kilos of raw beef in a day."],
 ["Nellie Bly","Reporter. Faked madness to get herself committed so she could write up the inside of the asylum. Later went round the world in 72 days."]
],

movies:[
 ["Zardoz","In 2293, an exterminator in a red nappy works out that the enormous flying stone head he worships is a con run by bored immortals."],
 ["Ravenous","Soldiers at a remote outpost in the Sierra Nevadas, and the man who gets stronger the more people he eats."],
 ["House","Seven schoolgirls go to stay with an aunt in the country. The house eats them, one at a time."],
 ["The Brood","Experimental therapy goes wrong, and a woman's rage starts producing actual children who go out and kill on her behalf."],
 ["Trog","An anthropologist finds an ape-man living in a cave in the English countryside and sets about civilising him."],
 ["Gymkata","An American gymnast enters a lethal contest in a made-up country so the US can put a satellite station there."],
 ["Riki-Oh","Superhuman prisoner. Punches his way out through a privatised jail."],
 ["Freaked","The owner of a roadside freak show turns a vain actor into a mutant."],
 ["Tetsuo: The Iron Man","Slowly, and horribly, a salaryman turns into a heap of scrap metal."],
 ["The Lure","Two mermaid sisters join a nightclub band in eighties Warsaw. They sing. They also eat men."],
 ["Hundreds of Beavers","Black and white, almost silent. A ruined applejack salesman becomes a fur trapper and fights an army of men in beaver costumes."],
 ["Dead Alive","Bitten by a rat-monkey, a man's mother becomes a zombie. He keeps the outbreak in the cellar for as long as he can manage."],
 ["The Red Turtle","No dialogue at all. A man is shipwrecked on an island, and a giant red turtle keeps preventing him from leaving."],
 ["Rubber","Out in the Californian desert, a car tyre comes to life and kills people by staring at them."],
 ["Miami Connection","Taekwondo orphans in a synth-rock band take on a gang of cocaine-dealing motorcycle ninjas."],
 ["The Cars That Ate Paris","An Australian town makes its living causing crashes on the road outside and stripping the wrecks."],
 ["Themroc","Sick of all of it, a factory worker stops speaking in actual words, bricks himself into his flat and reverts to being a caveman."],
 ["The Greasy Strangler","Father and son run a disco walking tour. At night the father covers himself in grease and strangles people."]
],

studies:[
 ["'Pigeons' discrimination of paintings by Monet and Picasso'","They managed it. Then did it again with paintings they'd never been shown."],
 ["'Fellatio by fruit bats prolongs copulation time'","It does. Considerably."],
 ["'Chickens prefer beautiful humans'","The chickens went for the same faces people find attractive."],
 ["'Walking with coffee: why does it spill?'","Your walking rhythm happens to match the frequency coffee sloshes at. The two line up, and over it goes."],
 ["'The nature of navel fluff'","It's fibres scraped off your clothes by abdominal hair and dragged inwards. Usually a greyish blue."],
 ["'Duration of urination does not change with body size'","Nearly every mammal over about 3kg takes roughly 21 seconds. Cats, humans, elephants."],
 ["'On the rheology of cats'","A cat can reasonably be treated as a liquid. Given long enough it takes the shape of whatever it's sitting in."],
 ["'Sword swallowing and its side effects'","Mostly sore throats. Injuries went up when they were distracted, or using more than one blade at a time."],
 ["'Termination of intractable hiccups with digital rectal massage'","The hiccups stopped."],
 ["'Are full or empty beer bottles sturdier?'","Empty ones. Though either will fracture a skull."],
 ["'The effects of wearing wet underwear in the cold'","Everyone was a great deal less comfortable. Core temperature didn't move."],
 ["'Do woodpeckers get headaches?'","No. The skull is built to absorb it."],
 ["'On the comparative palatability of dry-season tadpoles from Costa Rica'","The researcher put them in his own mouth, one species at a time, and ranked how foul each was."],
 ["'Pizza and risk of digestive tract cancers'","Italians who ate it regularly had a lower risk. The authors were careful to credit the tomatoes."],
 ["'A preliminary survey of rhinotillexis in adolescents'","Almost all of them picked their noses, about four times a day. A handful named it as their favourite activity."],
 ["'Why do wet dogs shake?'","The shake is tuned to fling nearly all the water off in under a second. Small animals have to shake faster than big ones."],
 ["'Dung beetles use the Milky Way for orientation'","They roll the ball in a straight line by steering off the band of the Milky Way."],
 ["'The effect of country music on suicide'","Cities with more country music on the radio had higher suicide rates, the authors reported."]
],

business:[
 ["Rent-a-Mourner","Hires out professional mourners by the hour so a funeral looks better attended."],
 ["LifeGem","Takes the carbon out of cremated remains and presses it into a diamond."],
 ["Celestis","Launches a portion of someone's ashes into orbit, or out past the moon."],
 ["Eternal Reefs","Mixes cremated remains into concrete and sinks them as artificial reefs."],
 ["Neuticles","Testicular implants. For dogs."],
 ["Doggles","Goggles for dogs."],
 ["Ostrich Pillow","A padded hood you put your entire head inside so you can nap at your desk."],
 ["Rent A Ruminant","Hires out herds of goats to clear overgrown land."],
 ["Rent-a-Chicken","Rents you hens, a coop and the feed for a season, so you can try it before committing."],
 ["Cuddle Up To Me","Books strictly platonic cuddling sessions by the hour."],
 ["Transcience Corporation","Sold Sea-Monkeys. Brine shrimp eggs, marketed as instant pets."],
 ["Lloyd Manufacturing Co.","Sold cocaine toothache drops in the 1880s. Advertised for use on children."],
 ["Huff Daland Dusters","Crop dusting — spraying pesticide over cotton fields. It grew into Delta Air Lines."],
 ["Kongo Gumi","Built Buddhist temples in Japan. Founded in 578, which made it the oldest company in the world."],
 ["Nihon Break Kogyo","Demolition. Briefly famous in Japan because its company song got into the charts."],
 ["Ziferblat","A café where everything is free and you pay by the minute for the time you spend in it."],
 ["Zildjian","Has been making cymbals since 1623. The name means 'son of the cymbal maker'."],
 ["Alcor Life Extension Foundation","Freezes people after death, on the chance that somebody can revive them later."]
]

};

module.exports = { CATEGORIES, DECK };
