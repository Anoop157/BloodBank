const  mongoose  = require("mongoose");
const inventoryModel = require("../models/inventoryModel");
const userModel = require("../models/userModel");

//create inventory
const createInventoryController = async(req,res) => {
    try {
        const {email,inventoryType} = req.body
        //validation
        const user = await userModel.findOne({email})
        if(!user){
            throw new Error('User Not Found')
        }


       /*if(inventoryType==='in' &&user.role !=='donor'){
            throw new Error('Not a donor account')
       }*/

       

       /*if(inventoryType==='out' &&user.role !=='hospital'){
        throw new Error('Not a hospital')
   }*/


   if(req.body.inventoryType == 'out'){
    const requestedBloodGroup = req.body.BloodGroup
    const requestedQuantityOfBlood = req.body.quantity
    const organisation = new mongoose.Types.ObjectId(req.body.userId)
    //calculate blood qnti
    const totalInOfrequestedBlood = await inventoryModel.aggregate([
        {$match:{
            organisation,
            inventoryType:'in',
            BloodGroup:requestedBloodGroup
        }}, {
            $group:{
                _id:'bloodGroup',
                total:{$sum:'$quantity'}
            }
        }
    ]);
    //console.log('Total In',totalInOfrequestedBlood)
    const totalIn = totalInOfrequestedBlood[0]?.total ||0;
    // calculate out blood qnt rotal out
    const totalOutOfRequestedBloodGroup = await inventoryModel.aggregate([
        {$match:{
            organisation,
            inventoryType:'out',
            bloodGroup:requestedBloodGroup
        }},
        {
            $group:{
                _id:'$bloodGroup',
                total:{$sum:'$quantity'}
            },
        },
    ]);
    const totalOut = totalOutOfRequestedBloodGroup[0]?.total ||0;

    //calc in out
    const availableQuanityOfBloodGroup = totalIn - totalOut;
    //quantity validation
    if (availableQuanityOfBloodGroup < requestedQuantityOfBlood) {
        return res.status(500).send({
          success: false,
          message: `Only ${availableQuanityOfBloodGroup}ML of ${requestedBloodGroup.toUpperCase()} is available`,
        });
    }
    req.body.hospital = user?._id;

    
   }

   //save record

   const inventory = new inventoryModel(req.body)
   await inventory.save()

   return res.status(201).send({
    success:true,
    message:'new Blood Record Added'
   });

    } catch (error) {
        console.log(error)
        return res.status(500).send({
            success:false,
            message:'Error in create Inventory API',
            error,
        });
    }
};
//get all blood rec
const getInventoryController = async(req,res) =>{
    try {
       const inventory = await inventoryModel.find({organisation:req.body.userId,
    })
    .populate("donor")
    .populate("hospital")
    .sort({createdAt:-1});
    return res.status(200).send({
        success:true,
        message:'get all records successfully',
        inventory,
    }) ;
    } catch (error) {
        console.log(error)
        return res.status(500).send({
            success:false,
            message:'Error in Get All Inventory ',
            error
        })
    }

}

module.exports = {createInventoryController,getInventoryController};