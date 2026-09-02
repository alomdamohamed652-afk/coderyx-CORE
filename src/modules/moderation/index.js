const fs=require("fs");
const path=require("path");
const commandRegistry=require("../../utils/commandRegistry");
const guildFeatures=require("../../utils/guildFeatures");
const features=require("../../utils/features");
const devLog=require("../../utils/devLogger");
const COMMANDS_DIR=path.join(__dirname,"commands");
module.exports={
 name:"moderation",version:"1.1.0",description:"أوامر الإدارة الأساسية مع تحكم لكل سيرفر",enabledByDefault:true,dependencies:[],
 init(){
  const files=fs.readdirSync(COMMANDS_DIR).filter(file=>file.endsWith(".js"));
  for(const file of files){
   const command=require(path.join(COMMANDS_DIR,file));
   if(!command?.data||typeof command.execute!=="function"){devLog.warn("[Moderation] تم تجاهل الملف "+file+" لأنه لا يحتوي على data/execute صحيحين.");continue;}
   const original=command.execute;
   commandRegistry.register(command.data,async interaction=>{
    const guildId=interaction.guildId;
    if(guildId&&!guildFeatures.isEnabled(guildId,"moderation",features.get("moderation.enabled")===true)) return interaction.reply({content:"❌ نظام الإدارة معطّل لهذا السيرفر من لوحة CODERYX.",ephemeral:true});
    return original(interaction);
   });
  }
 }
};