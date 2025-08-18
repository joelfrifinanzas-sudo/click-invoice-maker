import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  email: string;
  password?: string;
  full_name: string;
  company_id: string;
  role: 'admin' | 'cajera' | 'cliente';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== create_user_and_membership function started ===');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create service role client (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const body: RequestBody = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Validate input
    if (!body.email || !body.full_name || !body.company_id || !body.role) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, full_name, company_id, role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['admin', 'cajera', 'cliente'].includes(body.role)) {
      console.error('Invalid role:', body.role);
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be: admin, cajera, or cliente' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate company exists
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('id', body.company_id)
      .maybeSingle();

    if (companyError) {
      console.error('Error checking company:', companyError);
      return new Response(
        JSON.stringify({ error: 'Error validating company' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!company) {
      console.error('Company not found:', body.company_id);
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let userId: string;

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(body.email);
    
    if (existingUser?.user) {
      console.log('User already exists:', existingUser.user.id);
      userId = existingUser.user.id;
    } else {
      // Generate password if not provided
      const password = body.password || Math.random().toString(36).slice(-16) + 'A1!';
      
      console.log('Creating new user with email:', body.email);
      
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: body.full_name
        }
      });

      if (createError) {
        console.error('Error creating user:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user', details: createError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!newUser?.user) {
        console.error('No user returned from create operation');
        return new Response(
          JSON.stringify({ error: 'User creation failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = newUser.user.id;
      console.log('User created successfully:', userId);
    }

    // Upsert profile
    console.log('Upserting profile for user:', userId);
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: body.email,
        full_name: body.full_name
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Error upserting profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to create profile', details: profileError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Profile upserted successfully');

    // Insert user_company membership
    console.log('Inserting membership:', { userId, company_id: body.company_id, role: body.role });
    const { error: membershipError } = await supabaseAdmin
      .from('user_company')
      .insert({
        user_id: userId,
        company_id: body.company_id,
        role: body.role,
        status: 'active'
      })
      .select()
      .single();

    if (membershipError) {
      // Check if it's a conflict error (user already has membership)
      if (membershipError.code === '23505') {
        console.log('Membership already exists, updating role if needed');
        const { error: updateError } = await supabaseAdmin
          .from('user_company')
          .update({
            role: body.role,
            status: 'active'
          })
          .eq('user_id', userId)
          .eq('company_id', body.company_id);

        if (updateError) {
          console.error('Error updating existing membership:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update membership', details: updateError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        console.error('Error creating membership:', membershipError);
        return new Response(
          JSON.stringify({ error: 'Failed to create membership', details: membershipError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Membership created/updated successfully');

    // Return success response
    const response = {
      user_id: userId,
      email: body.email,
      role: body.role,
      status: 'active',
      company_id: body.company_id,
      full_name: body.full_name
    };

    console.log('=== Function completed successfully ===');
    console.log('Response:', JSON.stringify(response, null, 2));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Unexpected error in create_user_and_membership:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});