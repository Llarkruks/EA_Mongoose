import mongoose from 'mongoose';
import { UserModel, IUser } from './user.js';
import { OrganizationModel, IOrganization } from './organization.js';
import { ProjectModel, ProjectService } from './project.js'; 

async function runDemo() {
  try {
    // --- 1. CONNECTION ---
    await mongoose.connect('mongodb://127.0.0.1:27017/ea_mongoose');
    console.log('🚀 Connected to MongoDB');

    // --- 2. CLEANING (Idempotency) ---
    // Engineering Rule: Tests/Demos must be repeatable.
    console.log('🧹 Cleaning database...');
    await UserModel.deleteMany({});
    await OrganizationModel.deleteMany({});
    await ProjectModel.deleteMany({}); 

    // --- 3. SEEDING (The missing part) ---
    console.log('🌱 Seeding data...');

    // 3.1 Create Organizations first
    const orgs = await OrganizationModel.insertMany([
      { name: 'Initech', country: 'USA' },
      { name: 'Umbrella Corp', country: 'UK' }
    ]);
    
    // We map existing IDs to link them dynamically
    const initechId = orgs[0]._id;
    const umbrellaId = orgs[1]._id;

    // 3.2 Create Users linked to Orgs
    const usersData = [
      { name: 'Bill', email: 'bill@initech.com', role: 'ADMIN', organization: initechId },
      { name: 'Peter', email: 'peter@initech.com', role: 'USER', organization: initechId },
      { name: 'Alice', email: 'alice@umbrella.com', role: 'EDITOR', organization: umbrellaId }
    ];

    const users = await UserModel.insertMany(usersData);
    console.log(`✅ Seeded ${usersData.length} users and ${orgs.length} organizations`);

    // --- 4.1 DEMO: CRUD OPERATIONS ---
    console.log('\n🔧 CRUD DEMO:');
    const user: IUser | null = await UserModel.findById(users[0]._id);
    console.log(`User: ${user?.name}`);
    
    const bill = await UserModel.findOne({ name: 'Bill' });
    console.log(bill);
    
    const userPartial: Partial<IUser> | null  = await UserModel.findOne({ name: 'Bill' })
      .select('name email')
      .lean();
    console.log(userPartial);

    // --- 4.2 DEMO: POPULATE (Simulating JOINs) ---
    console.log('\n🔍 POPULATE:');
    const billOrg = await UserModel.findOne({ name: 'Bill' })
      .populate('organization')
      .lean();

    const orgDetails = billOrg?.organization as unknown as IOrganization;
    
    console.log(billOrg);
    console.log(`Works at: ${orgDetails?.name} (${orgDetails?.country})`);
    
    // --- 5. DEMO: AGGREGATION PIPELINE ---
    console.log('\n📊 TESTING AGGREGATION:');
    const stats = await UserModel.aggregate([
      { $match: { role: { $ne: 'GUEST' } } }, 
      { $group: { 
          _id: '$organization', 
          totalUsers: { $sum: 1 },
      }},
      { $lookup: {
          from: 'organizations',
          localField: '_id',
          foreignField: '_id',
          as: 'orgInfo'
      }},
      { $project: {
          organizationName: { $arrayElemAt: ['$orgInfo.name', 0] },
          totalUsers: 1
      }}
    ]);
    console.table(stats);

    // --- 6. DEMO: NUEVO SERVICE LAYER (PROJECT) ---
    console.log('\n🚀 PROBANDO EL CRUD DE PROJECT (SERVICE LAYER):');
    
    // 6.1 Create
    const myProject = await ProjectService.create({
      title: 'Dominar el mundo',
      organization: umbrellaId 
    });
    console.log('✅ 1. Create -> Creado:', myProject.title);

    // 6.2 getById (con populate)
    const populatedProject = await ProjectService.getById(myProject._id.toString());
    console.log('✅ 2. getById -> Obtenido con Populate (mira la organización entera):');
    console.log(populatedProject);

    // 6.3 update
    const updated = await ProjectService.update(myProject._id.toString(), { status: 'DONE' });
    console.log('✅ 3. Update -> Actualizado, nuevo estado:', updated?.status);

    // 6.4 listAll (con lean)
    const allProjects = await ProjectService.listAll();
    console.log('✅ 4. listAll -> Listado de todos usando lean():');
    console.log(allProjects);

    // 6.5 delete
    await ProjectService.delete(myProject._id.toString());
    console.log('✅ 5. Delete -> Proyecto eliminado correctamente.');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected');
  }
}

runDemo();